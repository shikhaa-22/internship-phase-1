import pool from '../config/db';

export interface PriceCalculationParams {
  serviceId: number;
  providerId?: number;
  doctorId?: number;
  addOnIds?: number[];
  startTimeStr?: string;
}

export interface AddOnItem {
  id: number;
  title: string;
  price: number;
  duration_minutes: number;
}

export async function calculateBookingPrice(params: PriceCalculationParams) {
  const { serviceId, providerId: pIdInput, doctorId: dIdInput, addOnIds = [], startTimeStr } = params;
  const targetProviderId = pIdInput || dIdInput;

  // 1. Base Service Fee & Category Details
  const [services]: any = await pool.execute(
    'SELECT title, base_price, duration_minutes, category_id, specialization_id FROM services WHERE id = ?', 
    [serviceId]
  );
  if (!services || !services.length) throw new Error('Service not found');
  
  const service = services[0];
  const basePrice = Number(service.base_price);
  let totalDuration = Number(service.duration_minutes);

  // 2. Dynamic Provider Tiering
  let seniorityLevel = 'standard';
  let tierMultiplier = 1.00;
  let tierAdjustment = 0;

  if (targetProviderId) {
    const [profiles]: any = await pool.execute(
      `SELECT pp.seniority_level, pp.tier_multiplier, pp.category_id, pp.consultation_fee, u.name AS provider_name, c.name AS category_name
       FROM provider_profiles pp 
       JOIN users u ON pp.user_id = u.id 
       LEFT JOIN categories c ON pp.category_id = c.id 
       WHERE pp.user_id = ?`,
      [targetProviderId]
    );

    if (profiles && profiles.length > 0) {
      const prov = profiles[0];

      // Validate category match if service specifies category
      if (service.category_id && prov.category_id && service.category_id !== prov.category_id) {
        throw new Error(
          `Provider ${prov.provider_name} is in ${prov.category_name || 'another category'} and is not eligible for ${service.title}.`
        );
      }

      seniorityLevel = prov.seniority_level || 'senior';
      tierMultiplier = Number(prov.tier_multiplier || 1.00);

      // Tier adjustment calculation
      if (tierMultiplier > 1.00) {
        tierAdjustment = basePrice * (tierMultiplier - 1.00);
      }
    }
  }

  // 3. Add-On Services
  let addOnsTotal = 0;
  const addOnItems: AddOnItem[] = [];

  if (addOnIds && addOnIds.length > 0) {
    const placeholders = addOnIds.map(() => '?').join(',');
    const [addOnRows]: any = await pool.execute(
      `SELECT id, title, price, duration_minutes FROM add_ons WHERE id IN (${placeholders})`,
      addOnIds
    );

    for (const row of addOnRows) {
      const itemPrice = Number(row.price);
      addOnsTotal += itemPrice;
      totalDuration += Number(row.duration_minutes || 0);
      addOnItems.push({
        id: row.id,
        title: row.title,
        price: itemPrice,
        duration_minutes: Number(row.duration_minutes || 0)
      });
    }
  }

  // Subtotal before dynamic rules and tax
  let currentTotal = basePrice + tierAdjustment + addOnsTotal;

  // 4. Dynamic Rules (Weekend, Peak Hour, Taxes)
  const start = startTimeStr ? new Date(startTimeStr.includes('T') ? startTimeStr : startTimeStr.replace(' ', 'T')) : new Date();
  const dayOfWeek = start.getDay(); // 0 = Sunday, 6 = Saturday
  const timeString = start.toTimeString().split(' ')[0]; // HH:MM:SS

  const [rules]: any = await pool.execute(
    `SELECT * FROM pricing_rules 
     WHERE (service_id = ? OR service_id IS NULL) 
     ORDER BY priority DESC`,
    [serviceId]
  );

  let taxAmount = 0;

  for (const rule of rules) {
    let applyRule = false;

    if (rule.rule_type === 'weekend' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      applyRule = true;
    } else if (rule.rule_type === 'peak_hour' && rule.start_time && rule.end_time) {
      if (timeString >= rule.start_time && timeString <= rule.end_time) {
        applyRule = true;
      }
    } else if (['fixed', 'hourly', 'discount', 'tax'].includes(rule.rule_type)) {
      applyRule = true; 
    }

    if (applyRule) {
      let adjustment = 0;
      if (rule.adjustment_type === 'percentage') {
        adjustment = currentTotal * (Number(rule.adjustment_value) / 100);
      } else {
        adjustment = Number(rule.adjustment_value);
      }

      if (rule.rule_type === 'tax') {
        taxAmount += adjustment;
      } else if (rule.rule_type === 'discount') {
        currentTotal -= adjustment;
      } else {
        currentTotal += adjustment;
      }
    }
  }

  const finalTotal = currentTotal + taxAmount;

  const seniorityLabels: Record<string, string> = {
    junior: 'Junior Practitioner',
    senior: 'Senior Specialist (+15%)',
    lead_specialist: 'Lead Specialist / Consultant (+30%)',
    standard: 'Standard Provider'
  };

  return {
    basePrice: Number(basePrice.toFixed(2)),
    durationMinutes: totalDuration,
    providerTier: {
      seniorityLevel,
      seniorityLabel: seniorityLabels[seniorityLevel] || seniorityLevel,
      tierMultiplier,
      adjustmentAmount: Number(tierAdjustment.toFixed(2))
    },
    addOns: {
      items: addOnItems,
      totalAmount: Number(addOnsTotal.toFixed(2))
    },
    subtotal: Number(currentTotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(finalTotal.toFixed(2)),
    breakdown: [
      { label: `Base Service Fee (${service.title})`, amount: Number(basePrice.toFixed(2)) },
      ...(tierAdjustment > 0 ? [{ label: `Dynamic Provider Tier (${seniorityLabels[seniorityLevel]})`, amount: Number(tierAdjustment.toFixed(2)) }] : []),
      ...addOnItems.map(a => ({ label: `Add-On: ${a.title}`, amount: Number(a.price.toFixed(2)) })),
      { label: `Taxes & Statutory Fees`, amount: Number(taxAmount.toFixed(2)) }
    ]
  };
}