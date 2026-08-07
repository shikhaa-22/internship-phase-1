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

export interface CategoryParams {
  name: string;
  description?: string;
  icon?: string;
}

export interface ServiceParams {
  category_id: number;
  specialization_id?: number | null;
  title: string;
  base_price: number;
  duration_minutes: number;
}

export interface AddOnParams {
  category_id?: number | null;
  title: string;
  description?: string;
  price: number;
  duration_minutes?: number;
}

export interface SpecializationParams {
  category_id: number;
  name: string;
}

export const appointmentService = {
  /**
   * Fetch all categories
   */
  async getCategories() {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  /**
   * Add a new category
   */
  async addCategory(params: CategoryParams) {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add category');
    return data;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: number) {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete category');
    return data;
  },

  /**
   * Fetch services (optional category filter)
   */
  async getServices(categoryId?: number) {
    const url = categoryId ? `${API_BASE}/services?categoryId=${categoryId}` : `${API_BASE}/services`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  },

  /**
   * Add a new service
   */
  async addService(params: ServiceParams) {
    const response = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add service');
    return data;
  },

  /**
   * Delete a service
   */
  async deleteService(id: number) {
    const response = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete service');
    return data;
  },

  /**
   * Fetch specializations (optional category filter)
   */
  async getSpecializations(categoryId?: number) {
    const url = categoryId ? `${API_BASE}/specializations?categoryId=${categoryId}` : `${API_BASE}/specializations`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch specializations');
    return response.json();
  },

  /**
   * Add a new specialization
   */
  async addSpecialization(params: SpecializationParams) {
    const response = await fetch(`${API_BASE}/specializations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add specialization');
    return data;
  },

  /**
   * Delete a specialization
   */
  async deleteSpecialization(id: number) {
    const response = await fetch(`${API_BASE}/specializations/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete specialization');
    return data;
  },

  /**
   * Add a new add-on service
   */
  async addAddOn(params: AddOnParams) {
    const response = await fetch(`${API_BASE}/add-ons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add add-on');
    return data;
  },

  /**
   * Delete an add-on service
   */
  async deleteAddOn(id: number) {
    const response = await fetch(`${API_BASE}/add-ons/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete add-on');
    return data;
  },

  /**
   * Fetch admin appointment overview
   */
  async getAdminAppointments() {
    const response = await fetch(`${API_BASE}/appointments/admin`);
    if (!response.ok) throw new Error('Failed to fetch admin appointments');
    return response.json();
  },

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

