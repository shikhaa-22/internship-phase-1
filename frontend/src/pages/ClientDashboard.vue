<template>
  <q-page class="q-pa-md">
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
      
    <q-card elevated bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      
      <div style="height: 20px;"></div>
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
          <div class="col-auto text-weight-medium">Price: <span class="text-primary">{{ priceDisplay }}</span></div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

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

// State refs
const services = ref<Service[]>([]);
const doctors = ref<Doctor[]>([]);
const selectedService = ref<number | null>(null);
const selectedDoctor = ref<number | null>(null);
const selectedSlot = ref<string | null>(null);
const date = ref('');
const price = ref<number | null>(null);

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
    console.log('doctors api ->', url, data);
    doctors.value = Array.isArray(data) ? data : [];
    if (!doctors.value.length) {
      $q.notify({ type: 'info', message: 'No doctors available for the selected speciality' });
    }
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Unable to load doctors' });
  }
};

onMounted(() => {
  void loadServices();
  void loadDoctors();
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
  } 
  catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Booking failed';
    $q.notify({ type: 'negative', message });
  }
};
</script>
