const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';

export interface CompleteConsultationParams {
  appointmentId: number;
  clinicalNotes: string;
  prescription: string;
}

export interface BlockSlotParams {
  doctorId: number;
  startTime: string;
  breakReason: string;
}

export interface AttachAddOnsParams {
  appointmentId: number;
  addOnIds: number[];
}

export interface CancelAppointmentParams {
  appointmentId: number;
  cancellationReason: string;
}

export const appointmentService = {
  /**
   * Fetch all appointments for a specific doctor
   */
  async getDoctorAppointments(doctorId: number) {
    const response = await fetch(
      `${API_BASE}/appointments/doctor?doctorId=${doctorId}&t=${Date.now()}`,
    );
    if (!response.ok) throw new Error('Failed to fetch doctor appointments');
    return response.json();
  },

  /**
   * Complete consultation & record clinical notes / prescriptions
   */
  async completeConsultation(params: CompleteConsultationParams) {
    const response = await fetch(`${API_BASE}/appointments/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to complete consultation');
    return response.json();
  },

  /**
   * Block a doctor break / off-duty time slot
   */
  async blockSlot(params: BlockSlotParams) {
    const response = await fetch(`${API_BASE}/appointments/block-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to block slot');
    return response.json();
  },

  /**
   * Unblock a previously reserved break slot
   */
  async unblockSlot(appointmentId: number) {
    const response = await fetch(`${API_BASE}/appointments/unblock-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    });
    if (!response.ok) throw new Error('Failed to unblock slot');
    return response.json();
  },

  /**
   * Fetch complete medical consultation history timeline for a patient
   */
  async getPatientHistory(clientId: number, requestorId?: number) {
    const url = requestorId 
      ? `${API_BASE}/patient/history?clientId=${clientId}&requestorId=${requestorId}`
      : `${API_BASE}/patient/history?clientId=${clientId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch patient history');
    return response.json();
  },

  /**
   * Fetch list of available diagnostic add-on services
   */
  async getAvailableAddOns(categoryId?: number, serviceId?: number) {
    let url = `${API_BASE}/add-ons`;
    if (serviceId) {
      url += `?serviceId=${serviceId}`;
    } else if (categoryId) {
      url += `?categoryId=${categoryId}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch add-on services');
    return response.json();
  },

  /**
   * Attach diagnostic add-on tests to an appointment
   */
  async attachAddOns(params: AttachAddOnsParams) {
    const response = await fetch(`${API_BASE}/appointments/add-ons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to attach add-on tests');
    return response.json();
  },

  /**
   * Cancel an appointment with mandatory cancellation reason
   */
  async cancelAppointment(params: CancelAppointmentParams) {
    const response = await fetch(`${API_BASE}/appointments/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: params.appointmentId,
        status: 'cancelled',
        cancellationReason: params.cancellationReason,
        cancellation_reason: params.cancellationReason,
      }),
    });
    if (!response.ok) throw new Error('Failed to cancel appointment');
    return response.json();
  },
};
