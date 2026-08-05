<template>
  <q-page class="q-pa-md">
    <!-- Header Card -->
    <q-card elevated bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold text-primary">Hello {{ userName }}</div>
          <div class="text-subtitle2 text-grey-7">Welcome to your client dashboard</div>
        </div>
        <q-btn color="negative" elevated icon="logout" label="Logout" no-caps @click="handleLogout" />
      </q-card-section>
    </q-card>
    
    <div style="height: 20px;"></div>
      
    <!-- Booking Section Card -->
    <q-card elevated bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      <q-card-section class="q-pb-none">
        <div class="text-h6 text-weight-bold text-primary">
          <q-icon name="event" class="q-mr-xs" /> Book an Appointment
        </div>
      </q-card-section>
      
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedService"
              :options="servicesOptions"
              label="Choose Speciality / Service"
              emit-value
              map-options
              option-label="title"
              option-value="id"
              dense
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedDoctor"
              :options="filteredDoctors"
              label="Choose Doctor"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              dense
              :disable="!selectedService"
              :hint="!selectedService ? 'Please select a specialty first' : ''"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input v-model="date" type="date" label="Date" dense />
          </div>

          <div class="col-12 col-md-4 q-mt-md">
            <q-select
              v-model="selectedSlot"
              :options="slotOptions"
              label="Available Slots"
              option-label="label"
              option-value="value"
              dense
              emit-value
              map-options
            />
          </div>
        </div>
        <div style="height: 20px;"></div>
        <div class="row q-mt-md items-center">
          <div class="col">
            <q-btn label="Calculate Price" color="primary" @click="calculatePrice" />
            <q-btn label="Book Appointment" color="positive" class="q-ml-sm" @click="bookAppointment" />
          </div>
          <div class="col-auto text-weight-medium">Price: <span class="text-primary text-h6">{{ priceDisplay }}</span></div>
        </div>
      </q-card-section>
    </q-card>

    <div style="height: 20px;"></div>

    <!-- Feature 1: My Appointments & History Section -->
    <q-card elevated bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-weight-bold text-primary">
          <q-icon name="history" class="q-mr-xs" /> My Appointments & History
        </div>
        <q-btn flat round icon="refresh" color="primary" @click="loadPatientHistory" />
      </q-card-section>

      <q-card-section>
        <q-table
          flat
          bordered
          :rows="historyItems"
          :columns="columns"
          row-key="id"
          :loading="loadingHistory"
          no-data-label="No appointments found"
        >
          <!-- Status Column Chip -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.status)"
                text-color="white"
                size="sm"
                class="text-weight-bold text-capitalize"
              >
                {{ props.row.status }}
              </q-chip>
            </q-td>
          </template>

          <!-- Amount Column -->
          <template #body-cell-total_amount="props">
            <q-td :props="props">
              <span class="text-weight-bold text-primary">₹ {{ Number(props.row.total_amount).toFixed(2) }}</span>
            </q-td>
          </template>

          <!-- Actions Column for Medical Notes & Prescriptions -->
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                v-if="props.row.clinical_notes || props.row.prescription"
                color="secondary"
                size="sm"
                icon="assignment"
                label="View Prescription"
                no-caps
                @click="openMedicalSummary(props.row)"
              />
              <span v-else class="text-grey-6 text-caption">No notes available</span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Feature 2: Prescription & Clinical Notes Modal Dialog -->
    <q-dialog v-model="showMedicalModal">
      <q-card style="min-width: 450px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">Medical Summary</div>
            <div class="text-caption text-blue-2">{{ selectedHistoryRecord?.doctor_name }} • {{ selectedHistoryRecord?.service_title }}</div>
          </div>
          <q-btn flat round icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-md">
            <strong>Date:</strong> {{ selectedHistoryRecord?.start_time }}
          </div>

          <!-- Clinical Notes Section -->
          <div v-if="selectedHistoryRecord?.clinical_notes" class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold text-primary row items-center q-mb-xs">
              <q-icon name="notes" class="q-mr-xs" /> Doctor Clinical Notes
            </div>
            <q-card flat class="bg-blue-1 q-pa-sm text-body2 text-grey-9" style="border-left: 4px solid #1976D2; border-radius: 4px">
              {{ selectedHistoryRecord.clinical_notes }}
            </q-card>
          </div>

          <!-- Prescription Section -->
          <div v-if="selectedHistoryRecord?.prescription" class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold text-positive row items-center q-mb-xs">
              <q-icon name="medication" class="q-mr-xs" /> Prescribed Medications
            </div>
            <q-card flat class="bg-green-1 q-pa-sm text-body2 text-grey-9" style="border-left: 4px solid #21BA45; border-radius: 4px">
              {{ selectedHistoryRecord.prescription }}
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-sm bg-grey-2">
          <q-btn flat label="Print" icon="print" color="primary" @click="printPrescription" />
          <q-btn flat label="Close" color="grey-8" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';

const router = useRouter();
const $q = useQuasar();

// Define interfaces
interface Service {
  id: number;
  title: string;
  specialization_id?: number | null;
  duration_minutes?: number;
}

interface Doctor {
  id: number;
  name: string;
  specialization_id?: number | null;
  specialization_name?: string | null;
}

interface AppointmentRow {
  start_time: string;
  end_time: string;
  status: string;
}

interface PatientHistoryItem {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  clinical_notes: string | null;
  prescription: string | null;
  cancellation_reason: string | null;
  total_amount: number | string;
  doctor_name: string;
  service_title: string;
  add_ons_summary: string | null;
}

// State refs
const services = ref<Service[]>([]);
const doctors = ref<Doctor[]>([]);
const selectedService = ref<number | null>(null);
const selectedDoctor = ref<number | null>(null);
const selectedSlot = ref<string | null>(null);
const date = ref('');
const price = ref<number | null>(null);

// History & Medical Summary State
const historyItems = ref<PatientHistoryItem[]>([]);
const loadingHistory = ref(false);
const showMedicalModal = ref(false);
const selectedHistoryRecord = ref<PatientHistoryItem | null>(null);

const columns: QTableColumn[] = [
  { name: 'start_time', label: 'Date & Time', field: 'start_time', align: 'left', sortable: true },
  { name: 'doctor_name', label: 'Doctor', field: 'doctor_name', align: 'left', sortable: true },
  { name: 'service_title', label: 'Service', field: 'service_title', align: 'left' },
  { name: 'add_ons_summary', label: 'Add-Ons', field: (row: PatientHistoryItem) => row.add_ons_summary || 'None', align: 'left' },
  { name: 'total_amount', label: 'Total Amount', field: 'total_amount', align: 'right', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'actions', label: 'Medical Notes', field: 'actions', align: 'center' },
];

const servicesOptions = computed(() => services.value.map(s => ({ id: s.id, title: s.title })));

const userName = computed(() => {
  try {
    const u = localStorage.getItem('user');
    if (!u) return 'Guest';
    return JSON.parse(u).name ?? 'Guest';
  } catch {
    return 'Guest';
  }
});

// Strictly filters doctors matching the selected service/specialty ID
const filteredDoctors = computed(() => {
  if (!selectedService.value) return [];
  const svc = services.value.find(s => s.id === selectedService.value);
  if (!svc || svc.specialization_id == null) return [];
  
  return doctors.value.filter(d => Number(d.specialization_id) === Number(svc.specialization_id));
});

// Slot state
const slotOptions = ref<{ label: string; value: string }[]>([]);
let currentBooked: Array<{ start_time: string; end_time: string; status: string }> = [];

const priceDisplay = computed(() => (price.value == null ? '-' : `₹ ${price.value}`));

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  void router.push('/');
};

const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';

const loadServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/services`);
    services.value = await res.json();
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load services' });
  }
};

const loadDoctors = async () => {
  try {
    const url = selectedService.value ? `${API_BASE}/doctors?serviceId=${selectedService.value}` : `${API_BASE}/doctors`;
    const resp = await fetch(url);
    const data = await resp.json();
    doctors.value = Array.isArray(data) ? data : [];
    if (!doctors.value.length) {
      $q.notify({ type: 'info', message: 'No doctors available for the selected speciality' });
    }
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load doctors' });
  }
};

const loadPatientHistory = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user || !user.id) return;

    loadingHistory.value = true;
    const res = await fetch(`${API_BASE}/patient/history?clientId=${user.id}`);
    if (res.ok) {
      historyItems.value = await res.json();
    }
  } catch (err: unknown) {
    console.error('Error fetching patient history:', err);
  } finally {
    loadingHistory.value = false;
  }
};

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'confirmed') return 'primary';
  if (s === 'completed') return 'positive';
  if (s === 'cancelled') return 'negative';
  if (s === 'pending') return 'warning';
  return 'grey-7';
};

const openMedicalSummary = (item: PatientHistoryItem) => {
  selectedHistoryRecord.value = item;
  showMedicalModal.value = true;
};

const printPrescription = () => {
  window.print();
};

onMounted(() => {
  void loadServices();
  void loadDoctors();
  void loadPatientHistory();
});

// Load booked appointments for selected doctor & date, then compute available slots
const loadDoctorAppointments = async (doctorId: number, dateStr: string) => {
  slotOptions.value = [];
  selectedSlot.value = null;
  if (!doctorId || !dateStr) return;
  try {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/appointments?date=${dateStr}`);
    if (!res.ok) throw new Error('Failed to load appointments');
    const rows = await res.json();
    currentBooked = rows.map((r: AppointmentRow) => ({ 
      start_time: r.start_time, 
      end_time: r.end_time, 
      status: r.status 
    }));
    computeAvailableSlots(dateStr);
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load doctor schedule' });
  }
};

const computeAvailableSlots = (dateStr: string) => {
  slotOptions.value = [];
  const svc = services.value.find(s => s.id === selectedService.value);
  const duration = svc?.duration_minutes ?? 60;

  const workStartMs = Date.parse(`${dateStr}T09:00:00`);
  const workEndMs = Date.parse(`${dateStr}T17:00:00`);

  // Ensure minimum 60 minutes slot length
  const slotDurationMinutes = Math.max(duration, 60);
  const slotDurationMs = slotDurationMinutes * 60000;

  // Keep cancelled and break slots blocked by treating them as occupied intervals
  const bookedMs = currentBooked
    .filter(b => {
      const status = (b.status || '').trim().toLowerCase();
      return status === 'confirmed' || status === 'pending' || status === 'completed' || status === 'cancelled' || status === 'blocked';
    })
    .map(b => ({ start: Date.parse(b.start_time.replace(' ', 'T')), end: Date.parse(b.end_time.replace(' ', 'T')) }))
    .filter(iv => !isNaN(iv.start) && !isNaN(iv.end))
    .sort((a, b) => a.start - b.start);

  // Merge overlapping booked intervals (in ms)
  const merged: { start: number; end: number }[] = [];
  for (const iv of bookedMs) {
    if (!merged.length) {
      merged.push({ start: iv.start, end: iv.end });
    } else {
      const last = merged[merged.length - 1]!;
      if (iv.start <= last.end) {
        if (iv.end > last.end) last.end = iv.end;
      } else {
        merged.push({ start: iv.start, end: iv.end });
      }
    }
  }

  // Build free intervals between workStartMs and workEndMs
  const freeIntervals: { start: number; end: number }[] = [];
  let cursor = workStartMs;
  for (const b of merged) {
    const bStart = Math.max(b.start, workStartMs);
    const bEnd = Math.min(b.end, workEndMs);
    if (bEnd <= workStartMs || bStart >= workEndMs) continue;
    if (bStart > cursor) freeIntervals.push({ start: cursor, end: bStart });
    cursor = Math.max(cursor, bEnd);
  }
  if (cursor < workEndMs) freeIntervals.push({ start: cursor, end: workEndMs });

  const slots: { label: string; value: string }[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');

  for (const free of freeIntervals) {
    let slotStartMs = free.start;
    // Align to nearest minute boundary
    slotStartMs = Math.floor(slotStartMs / 60000) * 60000;
    while (slotStartMs + slotDurationMs <= free.end) {
      const slotEndMs = slotStartMs + slotDurationMs;
      const startDate = new Date(slotStartMs);
      const endDate = new Date(slotEndMs);

      const label = `${startDate.toTimeString().slice(0, 5)} - ${endDate.toTimeString().slice(0, 5)}`;
      const localValue = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())}:${pad(startDate.getSeconds())}`;

      slots.push({ label, value: localValue });
      // Move forward by slot duration to avoid overlapping slots
      slotStartMs += slotDurationMs;
    }
  }

  slotOptions.value = slots.sort((a, b) => (a.value < b.value ? -1 : 1));
};

// Reset selected doctor and slots when service changes
watch(selectedService, () => {
  selectedDoctor.value = null;
  selectedSlot.value = null;
  slotOptions.value = [];
  void loadDoctors();
});

watch([selectedDoctor, date, selectedService], ([docId, d, svc]) => {
  if (docId && d && svc) {
    void loadDoctorAppointments(Number(docId), d);
  } else {
    slotOptions.value = [];
  }
});

const calculatePrice = async () => {
  if (!selectedService.value || !selectedSlot.value) {
    $q.notify({ type: 'negative', message: 'Select service, date and available slot first' });
    return;
  }

  const startTime = selectedSlot.value;
  try {
    const res = await fetch(`${API_BASE}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: selectedService.value, doctorId: selectedDoctor.value, addOnIds: [], startTime }),
    });
    if (!res.ok) throw new Error('Price API failed');
    const data = await res.json();
    price.value = data.totalAmount ?? data.total_amount ?? data.price ?? null;
    $q.notify({ type: 'positive', message: 'Price calculated' });
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to calculate price' });
  }
};

const bookAppointment = async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    $q.notify({ type: 'negative', message: 'You must be logged in as a client' });
    return;
  }

  const user = JSON.parse(userStr);
  const clientId = user.id;

  if (!selectedService.value || !selectedDoctor.value || !selectedSlot.value) {
    $q.notify({ type: 'negative', message: 'Please fill all fields and select a slot' });
    return;
  }

  const startTime = selectedSlot.value;

  // Ensure price is available
  if (price.value == null) {
    await calculatePrice();
    if (price.value == null) return;
  }

  try {
    const payload = {
      clientId,
      doctorId: selectedDoctor.value,
      serviceId: selectedService.value,
      startTime,
      baseAmount: price.value,
      taxAmount: 0,
      totalAmount: price.value,
      status: 'confirmed',
    };

    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking failed');
    $q.notify({ type: 'positive', message: 'Appointment booked successfully' });
    void loadPatientHistory(); // Refresh history automatically
  } 
  catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Booking failed';
    $q.notify({ type: 'negative', message });
  }
};
</script>

