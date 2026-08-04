import pool from '../config/db';

export async function calculateBookingPrice(serviceId: number, startTimeStr: string) {
    // 1. Fetch base service info
    const [services]: any = await pool.execute(
        'SELECT base_price, duration_minutes FROM services WHERE id = ?', 
        [serviceId]
    );
    if (!services.length) throw new Error('Service not found');
    
    let currentTotal = Number(services[0].base_price);
    const start = new Date(startTimeStr);
    const dayOfWeek = start.getDay(); // 0 = Sunday, 6 = Saturday
    const timeString = start.toTimeString().split(' ')[0]; // HH:MM:SS

    // 2. Fetch rules sorted by priority
    const [rules]: any = await pool.execute(
        `SELECT * FROM pricing_rules 
         WHERE (service_id = ? OR service_id IS NULL) 
         ORDER BY priority DESC`,
        [serviceId]
    );

    let taxAmount = 0;

    // 3. Loop through and apply matching rules
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
    return {
        basePrice: Number(services[0].base_price),
        taxAmount: Number(taxAmount.toFixed(2)),
        totalAmount: Number(finalTotal.toFixed(2))
    };
}