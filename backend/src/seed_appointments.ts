import pool from './config/db';

async function seedAppointments() {
  console.log('Inserting additional rich sample appointments into MySQL database...');
  const conn = await pool.getConnection();

  try {
    const sampleAppointments = [
      // Healthcare Category (Category 1)
      {
        client_id: 1,
        provider_id: 2,
        doctor_id: 2,
        service_id: 2,
        category_id: 1,
        start_time: '2026-08-08 09:30:00',
        end_time: '2026-08-08 10:30:00',
        base_amount: 195.00,
        tax_amount: 19.50,
        total_amount: 214.50,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 9,
        provider_id: 3,
        doctor_id: 3,
        service_id: 1,
        category_id: 1,
        start_time: '2026-08-08 11:00:00',
        end_time: '2026-08-08 12:00:00',
        base_amount: 100.00,
        tax_amount: 10.00,
        total_amount: 110.00,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 10,
        provider_id: 2,
        doctor_id: 2,
        service_id: 2,
        category_id: 1,
        start_time: '2026-08-01 14:00:00',
        end_time: '2026-08-01 15:00:00',
        base_amount: 195.00,
        tax_amount: 19.50,
        total_amount: 214.50,
        status: 'completed',
        cancellation_reason: null,
        clinical_notes: 'Follow-up consultation for hypertension monitoring. Blood pressure stabilized at 124/82 mmHg.',
        prescription: 'Continue Lisinopril 10mg once daily in the morning. Recheck BP weekly.'
      },
      {
        client_id: 9,
        provider_id: 2,
        doctor_id: 2,
        service_id: 2,
        category_id: 1,
        start_time: '2026-08-04 14:00:00',
        end_time: '2026-08-04 15:00:00',
        base_amount: 195.00,
        tax_amount: 19.50,
        total_amount: 214.50,
        status: 'cancelled',
        cancellation_reason: 'Client requested cancellation due to out-of-town work trip conflict.',
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 1,
        provider_id: 3,
        doctor_id: 3,
        service_id: 1,
        category_id: 1,
        start_time: '2026-08-09 10:00:00',
        end_time: '2026-08-09 11:00:00',
        base_amount: 100.00,
        tax_amount: 10.00,
        total_amount: 110.00,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },

      // Wellness & Fitness Category (Category 2)
      {
        client_id: 10,
        provider_id: 4,
        doctor_id: 4,
        service_id: 4,
        category_id: 2,
        start_time: '2026-08-08 14:00:00',
        end_time: '2026-08-08 15:00:00',
        base_amount: 80.00,
        tax_amount: 8.00,
        total_amount: 88.00,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 1,
        provider_id: 5,
        doctor_id: 5,
        service_id: 5,
        category_id: 2,
        start_time: '2026-08-03 16:00:00',
        end_time: '2026-08-03 17:00:00',
        base_amount: 103.50,
        tax_amount: 10.35,
        total_amount: 113.85,
        status: 'completed',
        cancellation_reason: null,
        clinical_notes: 'Post-marathon recovery session focusing on hamstring tightness and calf trigger points.',
        prescription: 'Foam roll hamstrings & calves 10 mins daily. Take warm Epsom salt baths post-training.'
      },
      {
        client_id: 9,
        provider_id: 5,
        doctor_id: 5,
        service_id: 5,
        category_id: 2,
        start_time: '2026-08-09 15:00:00',
        end_time: '2026-08-09 16:00:00',
        base_amount: 103.50,
        tax_amount: 10.35,
        total_amount: 113.85,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 10,
        provider_id: 4,
        doctor_id: 4,
        service_id: 4,
        category_id: 2,
        start_time: '2026-08-05 08:00:00',
        end_time: '2026-08-05 09:00:00',
        base_amount: 80.00,
        tax_amount: 8.00,
        total_amount: 88.00,
        status: 'cancelled',
        cancellation_reason: 'Client reported sudden onset fever and rescheduled workout session.',
        clinical_notes: null,
        prescription: null
      },

      // Consulting & Professional Services Category (Category 3)
      {
        client_id: 9,
        provider_id: 6,
        doctor_id: 6,
        service_id: 7,
        category_id: 3,
        start_time: '2026-08-08 13:00:00',
        end_time: '2026-08-08 14:00:00',
        base_amount: 260.00,
        tax_amount: 26.00,
        total_amount: 286.00,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 1,
        provider_id: 7,
        doctor_id: 7,
        service_id: 8,
        category_id: 3,
        start_time: '2026-08-09 11:00:00',
        end_time: '2026-08-09 12:00:00',
        base_amount: 325.00,
        tax_amount: 32.50,
        total_amount: 357.50,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 10,
        provider_id: 7,
        doctor_id: 7,
        service_id: 8,
        category_id: 3,
        start_time: '2026-08-02 11:00:00',
        end_time: '2026-08-02 12:00:00',
        base_amount: 325.00,
        tax_amount: 32.50,
        total_amount: 357.50,
        status: 'completed',
        cancellation_reason: null,
        clinical_notes: 'Reviewed Series-A fundraising deck, financial projections, and cap table allocations.',
        prescription: 'Action Plan: 1. Refine CAC and LTV metrics slide. 2. Prepare data room index for investors.'
      },
      {
        client_id: 9,
        provider_id: 6,
        doctor_id: 6,
        service_id: 7,
        category_id: 3,
        start_time: '2026-08-03 14:00:00',
        end_time: '2026-08-03 15:00:00',
        base_amount: 260.00,
        tax_amount: 26.00,
        total_amount: 286.00,
        status: 'cancelled',
        cancellation_reason: 'Client needed additional time to gather contract documentation before consultation.',
        clinical_notes: null,
        prescription: null
      },
      {
        client_id: 1,
        provider_id: 2,
        doctor_id: 2,
        service_id: 2,
        category_id: 1,
        start_time: '2026-08-10 10:00:00',
        end_time: '2026-08-10 11:00:00',
        base_amount: 195.00,
        tax_amount: 19.50,
        total_amount: 214.50,
        status: 'confirmed',
        cancellation_reason: null,
        clinical_notes: null,
        prescription: null
      }
    ];

    for (const appt of sampleAppointments) {
      await conn.execute(
        `INSERT INTO appointments 
         (client_id, provider_id, doctor_id, service_id, category_id, start_time, end_time, base_amount, tax_amount, total_amount, status, cancellation_reason, clinical_notes, prescription)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appt.client_id,
          appt.provider_id,
          appt.doctor_id,
          appt.service_id,
          appt.category_id,
          appt.start_time,
          appt.end_time,
          appt.base_amount,
          appt.tax_amount,
          appt.total_amount,
          appt.status,
          appt.cancellation_reason,
          appt.clinical_notes,
          appt.prescription
        ]
      );
    }

    console.log(`Successfully added ${sampleAppointments.length} new sample appointments!`);
  } catch (err: any) {
    console.error('Error seeding appointments:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedAppointments();
