import pool from '../config/db';

export interface PriceCalculationParams {
  serviceId: number;
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
  const { serviceId, doctorId, addOnIds = [], startTimeStr } = params;

  // 1. Base Service Fee
  const [services]: any = await pool.execute(
    'SELECT title, base_price, duration_minutes, specialization_id FROM services WHERE id = ?', 
    [serviceId]
  );
  if (!services || !services.length) throw new Error('Service not found');
  
  const service = services[0];
  const basePrice = Number(service.base_price);
  let totalDuration = Number(service.duration_minutes);

  // 2. Dynamic Provider Tiering & Domain Specialization Validation
  let seniorityLevel = 'standard';
  let tierMultiplier = 1.00;
  let tierAdjustment = 0;

  if (doctorId) {
    const [docProfiles]: any = await pool.execute(
      `SELECT dp.seniority_level, dp.tier_multiplier, dp.specialization_id, dp.consultation_fee, u.name AS doctor_name, sp.name AS specialization_name 
       FROM doctor_profiles dp 
       JOIN users u ON dp.user_id = u.id 
       LEFT JOIN specializations sp ON dp.specialization_id = sp.id 
       WHERE dp.user_id = ?`,
      [doctorId]
    );

    if (docProfiles && docProfiles.length > 0) {
      const doc = docProfiles[0];

      // Validate specialization match if service specifies required specialization
      if (service.specialization_id && doc.specialization_id && service.specialization_id !== doc.specialization_id) {
        const docSpec = doc.specialization_name || 'General Practitioner';
        throw new Error(
          `Doctor ${doc.doctor_name} (${docSpec}) is not qualified for ${service.title}. Please select a qualified specialist.`
        );
      }

      seniorityLevel = doc.seniority_level || 'senior';
      tierMultiplier = Number(doc.tier_multiplier || 1.00);

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
  const start = startTimeStr ? new Date(startTimeStr) : new Date();
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
    lead_specialist: 'Lead Department Chief (+30%)',
    standard: 'Standard Provider'
  };

  return {
    basePrice: Number(basePrice.toFixed(2)),
    durationMinutes: totalDuration,
    doctorTier: {
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