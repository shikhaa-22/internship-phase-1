<template>
  <q-page class="q-pa-md">
    <!-- Header Card -->
    <q-card elevated bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold text-primary">
            <q-icon size="44px" name="account_circle" class="q-mr-sm" />
            Hello {{ userName }}
          </div>
          <div class="text-subtitle2 text-grey-7">Welcome to your multi-category appointment dashboard</div>
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
        <div class="text-caption text-grey-6">Select category, service, qualified specialist, date and an available 1-hour time slot</div>
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <!-- 1. Appointment Category -->
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedCategory"
              :options="categories"
              label="1. Appointment Category"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              dense
              outlined
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.icon || 'event'" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- 2. Choose Service -->
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedService"
              :options="servicesOptions"
              label="2. Choose Service"
              emit-value
              map-options
              option-label="title"
              option-value="id"
              dense
              outlined
              :disable="!selectedCategory"
              :hint="!selectedCategory ? 'Select category first' : ''"
            />
          </div>

          <!-- 3. Choose Provider / Specialist (Filtered strictly by selected service) -->
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedDoctor"
              :options="doctors"
              label="3. Choose Specialist"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              dense
              outlined
              :disable="!selectedService"
              :hint="!selectedService ? 'Select service first to see qualified specialists' : ''"
            />
          </div>

          <!-- 4. Date Selection -->
          <div class="col-12 col-md-4">
            <q-input v-model="date" type="date" label="4. Appointment Date" dense outlined />
          </div>

          <!-- 5. 1-Hour Time Slot Selection (Strictly excluding booked slots) -->
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedSlot"
              :options="slotOptions"
              label="5. Available 1-Hour Slot"
              option-label="label"
              option-value="value"
              dense
              outlined
              emit-value
              map-options
              :disable="!selectedDoctor || !date"
              :hint="!selectedDoctor || !date ? 'Select specialist & date first' : (slotOptions.length === 0 ? 'No slots available for this date' : 'All slots are fixed 1-hour durations')"
            />
          </div>

          <!-- On-Screen Visual Time Slot Schedule Grid (Displayed strictly when service, specialist & date are selected) -->
          <div v-if="selectedService && selectedDoctor && date && allDaySlots.length > 0" class="col-12 q-mt-sm bg-grey-1 q-pa-sm rounded-borders" style="border: 1px solid #e2e8f0">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs row items-center">
              <q-icon name="event_seat" color="primary" class="q-mr-xs" />
              Slot Availability Grid for {{ date }}:
            </div>
            <div class="row q-gutter-xs items-center">
              <q-chip
                v-for="s in allDaySlots"
                :key="s.value"
                :color="s.isBooked ? 'red-2' : (selectedSlot === s.value ? 'primary' : 'green-2')"
                :text-color="s.isBooked ? 'red-9' : (selectedSlot === s.value ? 'white' : 'green-9')"
                :icon="s.isBooked ? 'block' : (selectedSlot === s.value ? 'check_circle' : 'event_available')"
                :clickable="!s.isBooked"
                :disable="s.isBooked"
                size="sm"
                class="text-weight-bold cursor-pointer"
                @click="!s.isBooked && selectSlotDirectly(s.value)"
              >
                {{ s.label }} • {{ s.isBooked ? 'BOOKED (UNAVAILABLE)' : (selectedSlot === s.value ? 'SELECTED' : 'Available') }}
              </q-chip>
            </div>
          </div>
        </div>
        <div style="height: 20px;"></div>
        <div class="row q-mt-md items-center justify-between">
          <div class="col-auto row items-center q-gutter-xs">
            <q-btn label="Calculate Price" color="primary" unelevated @click="calculatePrice" />
            <q-btn label="Book Appointment" color="positive" icon="check_circle" unelevated @click="bookAppointment" :loading="submittingBooking" />
          </div>
          <div class="col-auto text-weight-medium text-subtitle1">
            Total Price: <span class="text-primary text-h6 text-weight-bold">{{ priceDisplay }}</span>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div style="height: 20px;"></div>

    <!-- My Appointments & History Section with Category Filter -->
    <q-card elevated bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-weight-bold text-primary row items-center">
          <q-icon name="history" class="q-mr-xs" /> My Appointments & History
        </div>

        <!-- Filter Controls on Client Side -->
        <div class="row items-center q-gutter-xs">
          <q-btn-toggle
            v-model="historyCategoryFilter"
            toggle-color="primary"
            flat
            dense
            no-caps
            :options="[
              { label: 'All Services', value: 0 },
              { label: 'Doctor / Healthcare', value: 1 },
              { label: 'Wellness & Fitness', value: 2 },
              { label: 'Consulting & Professional', value: 3 }
            ]"
          />
          <q-btn flat round icon="refresh" color="primary" @click="loadPatientHistory" />
        </div>
      </q-card-section>

      <q-card-section>
        <q-table
          flat
          bordered
          :rows="filteredHistoryItems"
          :columns="columns"
          row-key="id"
          :loading="loadingHistory"
          no-data-label="No appointments found for selected filter"
        >
          <!-- Category Column Chip -->
          <template #body-cell-category_name="props">
            <q-td :props="props">
              <q-chip dense outline color="secondary" icon="category" size="sm" class="text-weight-bold">
                {{ props.row.category_name || 'Healthcare' }}
              </q-chip>
            </q-td>
          </template>

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

          <!-- Actions Column with Service-Specific Dynamic Buttons -->
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                v-if="props.row.clinical_notes || props.row.prescription"
                :color="getActionButtonColor(props.row.category_name)"
                size="sm"
                :icon="getActionButtonIcon(props.row.category_name)"
                :label="getActionButtonLabel(props.row.category_name)"
                no-caps
                @click="openMedicalSummary(props.row)"
              />
              <span v-else class="text-grey-6 text-caption">No notes available</span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Modal Dialog 1: Booking Confirmation Success Message -->
    <q-dialog v-model="showBookingSuccessModal" persistent>
      <q-card style="min-width: 480px; border-radius: 16px" class="q-pa-sm">
        <q-card-section class="bg-positive text-white row items-center justify-between">
          <div class="row items-center">
            <q-icon name="check_circle" size="md" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-weight-bold">Appointment Confirmed!</div>
              <div class="text-caption text-green-1">Your appointment has been successfully booked & confirmed</div>
            </div>
          </div>
          <q-btn flat round icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-card-section v-if="confirmedBookingDetails" class="q-pa-md">
          <div class="q-mb-md bg-green-1 q-pa-md rounded-borders text-grey-9" style="border-left: 5px solid #21BA45">
            <div class="row q-col-gutter-sm text-body2">
              <div class="col-6"><strong>Category:</strong> {{ confirmedBookingDetails.categoryName }}</div>
              <div class="col-6"><strong>Service:</strong> {{ confirmedBookingDetails.serviceTitle }}</div>
              <div class="col-6"><strong>Specialist:</strong> {{ confirmedBookingDetails.providerName }}</div>
              <div class="col-6"><strong>Status:</strong> <q-badge color="positive" class="text-weight-bold">CONFIRMED</q-badge></div>
              <div class="col-6"><strong>Date:</strong> {{ confirmedBookingDetails.date }}</div>
              <div class="col-6"><strong>Time Slot:</strong> {{ confirmedBookingDetails.timeSlot }}</div>
              <div class="col-12 class=q-mt-xs">
                <strong>Total Price Paid:</strong> <span class="text-weight-bold text-primary text-subtitle1">₹ {{ confirmedBookingDetails.totalAmount }}</span>
              </div>
            </div>
          </div>

          <div class="text-caption text-grey-7">
            <q-icon name="info" color="primary" class="q-mr-xs" />
            A booking confirmation notice has been sent to your registered email account. You can track this booking under <strong>My Appointments & History</strong> below.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-2">
          <q-btn flat label="Book Another" color="primary" v-close-popup @click="loadPatientHistory" />
          <q-btn unelevated label="View My Appointments" color="positive" v-close-popup @click="loadPatientHistory" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal Dialog 2: Appointment Summary & Notes -->
    <q-dialog v-model="showMedicalModal">
      <q-card style="min-width: 450px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">{{ getModalTitle(selectedHistoryRecord?.category_name) }}</div>
            <div class="text-caption text-blue-2">{{ selectedHistoryRecord?.provider_name || selectedHistoryRecord?.doctor_name }} • {{ selectedHistoryRecord?.service_title }}</div>
          </div>
          <q-btn flat round icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-md">
            <strong>Category:</strong> {{ selectedHistoryRecord?.category_name || 'Healthcare' }}<br />
            <strong>Date & Time:</strong> {{ selectedHistoryRecord?.start_time }}
          </div>

          <!-- Notes Section -->
          <div v-if="selectedHistoryRecord?.clinical_notes" class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold text-primary row items-center q-mb-xs">
              <q-icon name="notes" class="q-mr-xs" /> {{ getNotesHeader(selectedHistoryRecord?.category_name) }}
            </div>
            <q-card flat class="bg-blue-1 q-pa-sm text-body2 text-grey-9" style="border-left: 4px solid #1976D2; border-radius: 4px">
              {{ selectedHistoryRecord.clinical_notes }}
            </q-card>
          </div>

          <!-- Recommendations / Action Items -->
          <div v-if="selectedHistoryRecord?.prescription" class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold text-positive row items-center q-mb-xs">
              <q-icon :name="getRecommendationIcon(selectedHistoryRecord?.category_name)" class="q-mr-xs" /> {{ getRecommendationHeader(selectedHistoryRecord?.category_name) }}
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
interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface Service {
  id: number;
  category_id: number;
  specialization_id?: number | null;
  title: string;
  duration_minutes?: number;
}

interface Provider {
  id: number;
  name: string;
  category_id?: number | null;
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
  provider_name: string;
  service_title: string;
  service_id?: number;
  category_id?: number;
  category_name?: string;
  add_ons_summary: string | null;
}

interface ConfirmedBookingDetails {
  categoryName: string;
  serviceTitle: string;
  providerName: string;
  date: string;
  timeSlot: string;
  totalAmount: number | string;
}

interface SlotStatus {
  hour: number;
  label: string;
  value: string;
  isBooked: boolean;
}

// State refs
const categories = ref<Category[]>([]);
const services = ref<Service[]>([]);
const doctors = ref<Provider[]>([]);
const allDaySlots = ref<SlotStatus[]>([]);
const bookingSuccessMessage = ref('');
const bookingErrorMessage = ref('');

const selectedCategory = ref<number | null>(null);
const selectedService = ref<number | null>(null);
const selectedDoctor = ref<number | null>(null);
const selectedSlot = ref<string | null>(null);
const date = ref('');
const price = ref<number | null>(null);
const submittingBooking = ref(false);

// History Filter Ref
const historyCategoryFilter = ref<number>(0);

// History & Summary State
const historyItems = ref<PatientHistoryItem[]>([]);
const loadingHistory = ref(false);
const showMedicalModal = ref(false);
const selectedHistoryRecord = ref<PatientHistoryItem | null>(null);

// Booking Confirmation Success Modal State
const showBookingSuccessModal = ref(false);
const confirmedBookingDetails = ref<ConfirmedBookingDetails | null>(null);

const columns: QTableColumn[] = [
  { name: 'start_time', label: 'Date & Time', field: 'start_time', align: 'left', sortable: true },
  { name: 'category_name', label: 'Category', field: (row: PatientHistoryItem) => row.category_name || 'Healthcare', align: 'left' },
  { name: 'provider_name', label: 'Provider / Specialist', field: (row: PatientHistoryItem) => row.provider_name || row.doctor_name, align: 'left', sortable: true },
  { name: 'service_title', label: 'Service', field: 'service_title', align: 'left' },
  { name: 'add_ons_summary', label: 'Add-Ons', field: (row: PatientHistoryItem) => row.add_ons_summary || 'None', align: 'left' },
  { name: 'total_amount', label: 'Total Amount', field: 'total_amount', align: 'right', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'actions', label: 'Service Record Notes', field: 'actions', align: 'center' },
];

const servicesOptions = computed(() => {
  if (!selectedCategory.value) return services.value.map(s => ({ id: s.id, title: s.title }));
  return services.value
    .filter(s => Number(s.category_id) === Number(selectedCategory.value))
    .map(s => ({ id: s.id, title: s.title }));
});

const userName = computed(() => {
  try {
    const u = localStorage.getItem('user');
    if (!u) return 'Guest';
    return JSON.parse(u).name ?? 'Guest';
  } catch {
    return 'Guest';
  }
});

// Client-side history filter
const filteredHistoryItems = computed(() => {
  if (!historyCategoryFilter.value || historyCategoryFilter.value === 0) {
    return historyItems.value;
  }
  return historyItems.value.filter(item => {
    if (item.category_id) {
      return Number(item.category_id) === Number(historyCategoryFilter.value);
    }
    const catName = (item.category_name || '').toLowerCase();
    if (historyCategoryFilter.value === 1) return catName.includes('doctor') || catName.includes('health');
    if (historyCategoryFilter.value === 2) return catName.includes('wellness') || catName.includes('fitness');
    if (historyCategoryFilter.value === 3) return catName.includes('consult');
    return true;
  });
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

const selectSlotDirectly = (slotVal: string) => {
  selectedSlot.value = slotVal;
};

const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';

const loadCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (res.ok) {
      categories.value = await res.json();
      if (categories.value.length > 0 && !selectedCategory.value) {
        selectedCategory.value = categories.value[0]!.id;
      }
    }
  } catch (err: unknown) {
    console.error('Failed to load categories:', err);
  }
};

const loadServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/services`);
    services.value = await res.json();
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load services' });
  }
};

// Loads providers filtered strictly by selected service or category
const loadDoctors = async () => {
  try {
    let url = `${API_BASE}/providers`;
    if (selectedService.value) {
      url = `${API_BASE}/providers?serviceId=${selectedService.value}`;
    } else if (selectedCategory.value) {
      url = `${API_BASE}/providers?categoryId=${selectedCategory.value}`;
    }
    const resp = await fetch(url);
    const data = await resp.json();
    doctors.value = Array.isArray(data) ? data : [];
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load specialists' });
  }
};

const loadPatientHistory = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user || !user.id) return;

    loadingHistory.value = true;
    const res = await fetch(`${API_BASE}/patient/history?clientId=${user.id}&t=${Date.now()}`);
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

// Action button dynamic customization based on service category
const getActionButtonLabel = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'View Prescription';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'View Workout Plan';
  if (cat.includes('consult')) return 'View Action Items';
  return 'View Notes';
};

const getActionButtonIcon = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'medication';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'fitness_center';
  if (cat.includes('consult')) return 'assignment_turned_in';
  return 'assignment';
};

const getActionButtonColor = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'primary';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'positive';
  if (cat.includes('consult')) return 'deep-purple';
  return 'secondary';
};

const getModalTitle = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'Medical Summary & Prescription';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'Wellness & Session Summary';
  if (cat.includes('consult')) return 'Executive Summary & Action Items';
  return 'Appointment Summary & Notes';
};

const getNotesHeader = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'Doctor Clinical Notes';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'Trainer & Session Notes';
  if (cat.includes('consult')) return 'Consultant Notes & Observations';
  return 'Consultation Notes';
};

const getRecommendationHeader = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'Prescribed Medications';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'Fitness & Diet Recommendations';
  if (cat.includes('consult')) return 'Action Items & Next Steps';
  return 'Recommendations & Action Items';
};

const getRecommendationIcon = (catName?: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('doctor') || cat.includes('health')) return 'medication';
  if (cat.includes('wellness') || cat.includes('fitness')) return 'fitness_center';
  return 'assignment_turned_in';
};

const openMedicalSummary = (item: PatientHistoryItem) => {
  selectedHistoryRecord.value = item;
  showMedicalModal.value = true;
};

const printPrescription = () => {
  window.print();
};

const getTodayDateStr = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

onMounted(async () => {
  if (!date.value) {
    date.value = getTodayDateStr();
  }
  await loadCategories();
  await loadServices();

  const saved = sessionStorage.getItem('booking_persist');
  if (saved) {
    sessionStorage.removeItem('booking_persist');
    try {
      const data = JSON.parse(saved);
      if (data.dt) date.value = data.dt;
      if (data.cat) selectedCategory.value = data.cat;
      if (data.svc) selectedService.value = data.svc;
      if (data.doc) selectedDoctor.value = data.doc;
      if (data.msg) bookingSuccessMessage.value = data.msg;
      if (data.details) confirmedBookingDetails.value = data.details;
    } catch (e) {
      console.error(e);
    }
  }

  await loadDoctors();
  await loadPatientHistory();

  if (selectedDoctor.value && date.value) {
    await loadDoctorAppointments(Number(selectedDoctor.value), date.value);
  }
});

// Load booked appointments for selected provider & date
const loadDoctorAppointments = async (providerId: number, dateStr: string) => {
  slotOptions.value = [];
  selectedSlot.value = null;
  if (!providerId || !dateStr) return;
  try {
    const res = await fetch(`${API_BASE}/providers/${providerId}/appointments?date=${dateStr}&t=${Date.now()}`);
    if (!res.ok) throw new Error('Failed to load schedule');
    const rows = await res.json();
    currentBooked = rows.map((r: AppointmentRow) => ({ 
      start_time: r.start_time, 
      end_time: r.end_time, 
      status: r.status 
    }));
    computeAvailableSlots(dateStr);
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load provider schedule' });
  }
};

/**
 * Computes available slots based on the selected service's exact duration (e.g. 30, 45, or 60 mins).
 * Strictly excludes any slot that overlaps with an active booked appointment (confirmed, pending, completed, blocked).
 */
const computeAvailableSlots = (dateStr: string) => {
  slotOptions.value = [];
  allDaySlots.value = [];
  if (!dateStr) return;

  const pad = (n: number) => String(n).padStart(2, '0');

  // Fetch duration of selected service (default 60 mins if unspecified)
  const svcObj = services.value.find(s => Number(s.id) === Number(selectedService.value));
  const durationMins = svcObj ? Number(svcObj.duration_minutes) : 60;

  // Standard work hours starting points: 09:00 to 17:00
  const standardHours = [9, 10, 11, 12, 13, 14, 15, 16];

  // Active bookings that occupy time
  const activeBookings = currentBooked
    .map(b => {
      const startMs = Date.parse(b.start_time.replace(' ', 'T'));
      const endMs = Date.parse(b.end_time.replace(' ', 'T'));
      return { startMs, endMs };
    })
    .filter(iv => !isNaN(iv.startMs) && !isNaN(iv.endMs));

  const available: { label: string; value: string }[] = [];
  const fullGrid: SlotStatus[] = [];

  for (const hour of standardHours) {
    const slotStartMs = Date.parse(`${dateStr}T${pad(hour)}:00:00`);
    const slotEndMs = slotStartMs + durationMins * 60000;

    // Check if this slot overlaps with ANY active booking
    const isOccupied = activeBookings.some(
      b => slotStartMs < b.endMs && slotEndMs > b.startMs
    );

    const startD = new Date(slotStartMs);
    const endD = new Date(slotEndMs);

    const formatAmPm = (d: Date) => {
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${pad(h)}:${m} ${ampm}`;
    };

    const timeLabel = `${formatAmPm(startD)} - ${formatAmPm(endD)}`;
    const valueStr = `${dateStr} ${pad(hour)}:00:00`;

    fullGrid.push({
      hour,
      label: timeLabel,
      value: valueStr,
      isBooked: isOccupied
    });

    if (!isOccupied) {
      available.push({ label: `${timeLabel} (${durationMins} Mins)`, value: valueStr });
    }
  }

  slotOptions.value = available;
  allDaySlots.value = fullGrid;
};

// Reset options when category changes
watch(selectedCategory, () => {
  selectedService.value = null;
  selectedDoctor.value = null;
  selectedSlot.value = null;
  slotOptions.value = [];
  price.value = null;
  bookingSuccessMessage.value = '';
  bookingErrorMessage.value = '';
  void loadDoctors();
});

// Re-filter qualified specialists when service changes
watch(selectedService, () => {
  selectedDoctor.value = null;
  selectedSlot.value = null;
  slotOptions.value = [];
  price.value = null;
  bookingSuccessMessage.value = '';
  bookingErrorMessage.value = '';
  void loadDoctors();
});

watch([selectedDoctor, date, selectedService], ([provId, d, svc]) => {
  if (provId && d && svc) {
    void loadDoctorAppointments(Number(provId), d);
  } else {
    slotOptions.value = [];
  }
});

// Auto recalculate price whenever slot changes
watch(selectedSlot, (slot) => {
  if (slot && selectedService.value) {
    void calculatePrice();
  } else {
    price.value = null;
  }
});

const calculatePrice = async () => {
  if (!selectedService.value || !selectedSlot.value) {
    return;
  }

  const startTime = selectedSlot.value;
  try {
    const res = await fetch(`${API_BASE}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: selectedService.value,
        providerId: selectedDoctor.value,
        doctorId: selectedDoctor.value,
        addOnIds: [],
        startTime
      }),
    });
    if (!res.ok) throw new Error('Price calculation failed');
    const data = await res.json();
    price.value = data.totalAmount ?? data.total_amount ?? data.price ?? null;
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to calculate price' });
  }
};

const bookAppointment = async () => {
  bookingSuccessMessage.value = '';
  bookingErrorMessage.value = '';

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    const msg = 'You must be logged in as a client to book an appointment.';
    bookingErrorMessage.value = msg;
    $q.notify({ type: 'negative', message: msg });
    return;
  }

  const user = JSON.parse(userStr);
  const clientId = user.id;

  if (!selectedCategory.value || !selectedService.value || !selectedDoctor.value || !selectedSlot.value) {
    const msg = 'Please fill all required booking fields (Category, Service, Specialist, Date, and Time Slot).';
    bookingErrorMessage.value = msg;
    $q.notify({ type: 'negative', message: msg });
    return;
  }

  const startTime = selectedSlot.value;

  // Enforce service quota (max 10 appointments per service)
  const serviceQuotaCount = historyItems.value.filter(item => {
    const s = (item.status || '').toLowerCase();
    const isSvcMatch = Number(item.service_id) === Number(selectedService.value);
    const isActive = s === 'confirmed' || s === 'pending' || s === 'completed';
    return isSvcMatch && isActive;
  }).length;

  if (serviceQuotaCount >= 10) {
    const msg = 'Max appt quota over';
    bookingErrorMessage.value = msg;
    if ($q && typeof $q.notify === 'function') {
      $q.notify({ type: 'negative', message: msg, icon: 'warning', position: 'top', timeout: 5000 });
    }
    return;
  }

  if (price.value == null) {
    await calculatePrice();
    if (price.value == null) {
      const msg = 'Unable to calculate price for the selected service. Please try again.';
      bookingErrorMessage.value = msg;
      $q.notify({ type: 'negative', message: msg });
      return;
    }
  }

  submittingBooking.value = true;
  try {
    const payload = {
      clientId,
      categoryId: selectedCategory.value,
      providerId: selectedDoctor.value,
      doctorId: selectedDoctor.value,
      serviceId: selectedService.value,
      addOnIds: [],
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
    if (!res.ok) {
      throw new Error(data.error || 'Booking failed. This time slot may already be occupied.');
    }

    // Get human-readable details for confirmation message modal
    const catObj = categories.value.find(c => c.id === selectedCategory.value);
    const svcObj = services.value.find(s => s.id === selectedService.value);
    const docObj = doctors.value.find(d => d.id === selectedDoctor.value);
    const slotObj = slotOptions.value.find(s => s.value === selectedSlot.value);

    confirmedBookingDetails.value = {
      categoryName: catObj?.name || 'Category Service',
      serviceTitle: svcObj?.title || 'Selected Service',
      providerName: docObj?.name || 'Specialist',
      date: date.value,
      timeSlot: slotObj?.label || '1-Hour Slot',
      totalAmount: price.value,
    };

    // Trigger high-priority confirmation notification banner
    const successMsg = `🎉 Appointment Confirmed! Booked with ${docObj?.name || 'Specialist'} for ${date.value} (${slotObj?.label || '1-Hour Slot'})`;
    bookingErrorMessage.value = '';
    bookingSuccessMessage.value = successMsg;

    if ($q && typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        icon: 'check_circle',
        message: successMsg,
        caption: `Total Paid: ₹${price.value}`,
        position: 'top',
        timeout: 6000
      });
    }

    // Optimistically insert new appointment into state immediately
    const newItem: PatientHistoryItem = {
      id: Number(data.appointmentId || Date.now()),
      start_time: startTime,
      end_time: startTime,
      status: 'confirmed',
      clinical_notes: null,
      prescription: null,
      cancellation_reason: null,
      total_amount: price.value || 0,
      doctor_name: docObj?.name || 'Specialist',
      provider_name: docObj?.name || 'Specialist',
      service_title: svcObj?.title || 'Selected Service',
      service_id: Number(selectedService.value),
      category_id: selectedCategory.value ? Number(selectedCategory.value) : 1,
      category_name: catObj?.name || 'Healthcare',
      add_ons_summary: null,
    };

    historyCategoryFilter.value = 0;
    historyItems.value = [newItem, ...historyItems.value.filter(i => i.id !== newItem.id)];

    const currentDoc = selectedDoctor.value;

    // Reset slot selection
    selectedSlot.value = null;
    price.value = null;

    // Display confirmation modal
    showBookingSuccessModal.value = true;

    // Fetch updated history timeline & provider schedule from server
    await loadPatientHistory();
    if (currentDoc && date.value) {
      await loadDoctorAppointments(Number(currentDoc), date.value);
    }
  } 
  catch (err: unknown) {
    console.error(err);
    bookingSuccessMessage.value = '';
    const message = err instanceof Error ? err.message : 'Booking failed';
    bookingErrorMessage.value = message;
    if ($q && typeof $q.notify === 'function') {
      $q.notify({ type: 'negative', message });
    }
  } finally {
    submittingBooking.value = false;
  }
};
</script>
