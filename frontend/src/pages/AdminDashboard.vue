<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Header Banner -->
    <q-card elevated  class="q-mb-md shadow-2 bg-gradient-primary text-white" style="border-radius: 14px">
      <q-card-section class="row items-center justify-between q-pa-lg bg-white text-primary" >
        <div class="row items-center q-gutter-sm">
          <q-avatar size="44px" color="primary" text-color="white" icon="admin_panel_settings"  />
          <div>
            <div class="row items-center q-gutter-xs">
                <span class="text-h6 text-weight-bold text-slate-900">Welcome Back Admin</span>
                
            </div>
            <div class="text-caption text-grey-8">
                Category & Service Configuration Dashboard
              </div>
            
          </div>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn color="negative" elevated icon="logout" label="Logout" no-caps @click="handleLogout" />
        </div>
      </q-card-section>
      <!-- Quick Metrics Ribbon -->

    </q-card>

    <q-card elevated  class="q-mb-md shadow-2 bg-gradient-primary text-white" style="border-radius: 14px">
      <q-card-section class="row items-center justify-between q-pa-lg bg-white text-primary" >
        <div class="col-xs-6 col-sm-3">
          <div class="row items-center q-gutter-sm">
            <q-icon name="category" color="primary" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">CATEGORIES</div>
              <div class="text-h6 text-weight-bolder text-primary">{{ categories.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-3">
          <div class="row items-center q-gutter-sm">
            <q-icon name="room_service" color="secondary" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">SERVICES</div>
              <div class="text-h6 text-weight-bolder text-secondary">{{ services.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-3">
          <div class="row items-center q-gutter-sm">
            <q-icon name="extension" color="accent" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">ADD-ONS</div>
              <div class="text-h6 text-weight-bolder text-accent">{{ addOns.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-3">
          <div class="row items-center q-gutter-sm">
            <q-icon name="psychology" color="positive" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">SPECIALIZATIONS</div>
              <div class="text-h6 text-weight-bolder text-positive">{{ specializations.length }}</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>


    <!-- Top Action Bar -->
    <div class="row items-center justify-between q-mb-md">
      <q-tabs v-model="activeTab" dense active-color="primary" indicator-color="primary" align="left" class="bg-white shadow-1" style="border-radius: 10px; padding: 4px;">
        <q-tab name="categories" icon="category" label="Categories" no-caps />
        <q-tab name="services" icon="room_service" label="Services (Prices & Duration)" no-caps />
        <q-tab name="add_ons" icon="extension" label="Add-Ons" no-caps />
        <q-tab name="specializations" icon="psychology" label="Specializations" no-caps />
        <q-tab name="appointments" icon="event_note" label="Appointments" no-caps />
      </q-tabs>

      <div class="row q-gutter-sm">
        <q-btn color="primary" icon="add" label="New Category" no-caps elevated style="border-radius: 8px" @click="showCategoryModal = true" />
        <q-btn color="secondary" icon="add" label="New Service" no-caps elevated style="border-radius: 8px" @click="showServiceModal = true" />
        <q-btn color="accent" icon="add" label="New Add-On" no-caps elevated style="border-radius: 8px" @click="showAddOnModal = true" />
        <q-btn color="positive" icon="add" label="New Specialization" no-caps elevated style="border-radius: 8px" @click="showSpecModal = true" />
      </div>
    </div>

    <!-- Feedback Message Banner -->
    <q-banner v-if="feedbackMsg" :class="feedbackIsError ? 'bg-negative text-white' : 'bg-positive text-white'" class="q-mb-md shadow-2" style="border-radius: 8px">
      <template #avatar>
        <q-icon :name="feedbackIsError ? 'error' : 'check_circle'" color="white" />
      </template>
      <div class="text-weight-bold">{{ feedbackMsg }}</div>
      <template #action>
        <q-btn elevated color="white" label="Dismiss" no-caps @click="feedbackMsg = ''" />
      </template>
    </q-banner>

    <!-- TAB 1: CATEGORIES -->
    <div v-if="activeTab === 'categories'">
      <div class="row q-col-gutter-md">
        <div v-for="cat in categories" :key="cat.id" class="col-xs-12 col-sm-6 col-md-4">
          <q-card elevated bordered class="shadow-1 hover-shadow" style="border-radius: 12px; height: 100%;">
            <q-card-section class="row items-center justify-between bg-blue-1">
              <div class="row items-center q-gutter-sm">
                <q-avatar color="primary" text-color="white" :icon="cat.icon || 'event'" size="42px" class="shadow-1" />
                <div>
                  <div class="text-h6 text-weight-bold text-primary">{{ cat.name }}</div>
                  <div class="text-caption text-grey-7">Category ID: #{{ cat.id }}</div>
                </div>
              </div>
              <q-btn color="negative" elevated round icon="delete" size="sm" @click="confirmDeleteCategory(cat)" />
            </q-card-section>
            <q-card-section>
              <div class="text-body2 text-grey-8">{{ cat.description || 'No description provided.' }}</div>
              <q-separator class="q-my-md" />
              <div class="row items-center justify-between text-caption text-grey-7">
                <span>Services count: <q-chip dense color="primary" text-color="white">{{ getCategoryServicesCount(cat.id) }}</q-chip></span>
                <span>Add-ons count: <q-chip dense color="accent" text-color="white">{{ getCategoryAddOnsCount(cat.id) }}</q-chip></span>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- TAB 2: SERVICES (PRICES & DURATION) -->
    <div v-if="activeTab === 'services'">
      <q-card elevated bordered class="shadow-1" style="border-radius: 12px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold text-secondary">Managed Services & Pricing Rules</div>
          <q-btn color="secondary" icon="add" label="Add Service" no-caps elevated @click="showServiceModal = true" />
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-table
            elevated
            bordered
            :rows="services"
            :columns="serviceColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-base_price="props">
              <q-td :props="props">
                <q-chip color="green-1" text-color="green-9" class="text-weight-bold">
                  ${{ Number(props.value).toFixed(2) }}
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-duration_minutes="props">
              <q-td :props="props">
                <q-chip color="orange-1" text-color="orange-9" icon="schedule" class="text-weight-bold">
                  {{ props.value }} mins
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" align="center">
                <q-btn color="negative" elevated round icon="delete" size="sm" @click="confirmDeleteService(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- TAB 3: ADD-ONS -->
    <div v-if="activeTab === 'add_ons'">
      <q-card elevated bordered class="shadow-1" style="border-radius: 12px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold text-accent">Managed Add-On Amenities & Tests</div>
          <q-btn color="accent" icon="add" label="Add Add-On" no-caps elevated @click="showAddOnModal = true" />
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-table
            elevated
            bordered
            :rows="addOns"
            :columns="addOnColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-price="props">
              <q-td :props="props">
                <q-chip color="purple-1" text-color="purple-9" class="text-weight-bold">
                  ${{ Number(props.value).toFixed(2) }}
                </q-chip>
              </q-td>
            </template>
            <!-- <template #body-cell-duration_minutes="props">
              <q-td :props="props">
                <span v-if="props.value > 0" class="text-weight-bold text-deep-orange">+{{ props.value }} mins</span>
                <span v-else class="text-grey-6">No extra time</span>
              </q-td>
            </template> -->
            <template #body-cell-category_name="props">
              <q-td :props="props">
                <q-chip v-if="props.value" color="blue-1" text-color="blue-9" dense>{{ props.value }}</q-chip>
                <q-chip v-else color="grey-3" text-color="grey-8" dense>Global (All Categories)</q-chip>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" align="center">
                <q-btn color="negative" elevated round icon="delete" size="sm" @click="confirmDeleteAddOn(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- TAB 4: SPECIALIZATIONS -->
    <div v-if="activeTab === 'specializations'">
      <q-card elevated bordered class="shadow-1" style="border-radius: 12px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold text-positive">Specializations & Niche Areas</div>
          <q-btn color="positive" icon="add" label="Add Specialization" no-caps elevated @click="showSpecModal = true" />
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-table
            elevated
            bordered
            :rows="specializations"
            :columns="specColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-actions="props">
              <q-td :props="props" align="center">
                <q-btn color="negative" elevated round icon="delete" size="sm" @click="confirmDeleteSpec(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- TAB 5: APPOINTMENTS OVERVIEW -->
    <div v-if="activeTab === 'appointments'">
      <q-card elevated bordered class="shadow-1" style="border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-primary">System Appointments Log</div>
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-table
            elevated
            bordered
            :rows="adminAppointments"
            :columns="apptColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip :color="getStatusColor(props.value)" text-color="white" dense class="text-capitalize text-weight-bold">
                  {{ props.value }}
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-total_amount="props">
              <q-td :props="props">
                <span class="text-weight-bold text-green-9">${{ Number(props.value).toFixed(2) }}</span>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- MODAL 1: ADD CATEGORY -->
    <q-dialog v-model="showCategoryModal" persistent>
      <q-card style="min-width: 420px; border-radius: 14px">
        <q-card-section class="row items-center justify-between bg-primary text-white">
          <div class="text-h6 text-weight-bold">Add New Appointment Category</div>
          <q-btn elevated round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="submitAddCategory" class="q-gutter-md">
            <q-input
              v-model="newCategory.name"
              label="Category Name *"
              hint="e.g., Education & Tutoring, Legal Advisory, Fitness"
              outlined
              dense
              :rules="[val => !!val && val.trim().length > 0 || 'Category name is required']"
            />
            <q-input
              v-model="newCategory.description"
              label="Description"
              type="textarea"
              outlined
              dense
              rows="3"
              hint="Brief summary of category services"
            />
            <q-select
              v-model="newCategory.icon"
              :options="iconOptions"
              label="Select Material / Quasar Icon *"
              outlined
              dense
              emit-value
              map-options
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.value" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template #prepend>
                <q-icon :name="newCategory.icon || 'event'" color="primary" />
              </template>
            </q-select>

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn elevated label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn type="submit" label="Create Category" color="primary" no-caps elevated :loading="submitting" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- MODAL 2: ADD SERVICE -->
    <q-dialog v-model="showServiceModal" persistent>
      <q-card style="min-width: 450px; border-radius: 14px">
        <q-card-section class="row items-center justify-between bg-secondary text-white">
          <div class="text-h6 text-weight-bold">Add New Service (Price & Duration)</div>
          <q-btn elevated round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="submitAddService" class="q-gutter-md">
            <q-select
              v-model="newService.category_id"
              :options="categorySelectOptions"
              label="Category *"
              outlined
              dense
              emit-value
              map-options
              :rules="[val => !!val || 'Category is required']"
            />
            <q-select
              v-model="newService.specialization_id"
              :options="filteredSpecOptions"
              label="Specialization (Optional)"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
            <q-input
              v-model="newService.title"
              label="Service Title *"
              hint="e.g. Full Body Checkup, Math SAT Prep Session"
              outlined
              dense
              :rules="[val => !!val && val.trim().length > 0 || 'Service title is required']"
            />
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model.number="newService.base_price"
                  label="Base Price ($) *"
                  type="number"
                  prefix="$"
                  step="0.01"
                  outlined
                  dense
                  :rules="[val => val !== null && val >= 0 || 'Valid non-negative price required']"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="newService.duration_minutes"
                  label="Duration (mins) *"
                  type="number"
                  suffix="mins"
                  step="5"
                  outlined
                  dense
                  :rules="[val => val && val > 0 || 'Valid duration required']"
                />
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn elevated label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn type="submit" label="Create Service" color="secondary" no-caps elevated :loading="submitting" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- MODAL 3: ADD ADD-ON -->
    <q-dialog v-model="showAddOnModal" persistent>
      <q-card style="min-width: 450px; border-radius: 14px">
        <q-card-section class="row items-center justify-between bg-accent text-white">
          <div class="text-h6 text-weight-bold">Add New Add-On Amenity / Diagnostic Test</div>
          <q-btn elevated round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="submitAddAddOn" class="q-gutter-md">
            <q-select
              v-model="newAddOn.category_id"
              :options="categorySelectOptionsWithGlobal"
              label="Target Category *"
              outlined
              dense
              emit-value
              map-options
            />
            <q-input
              v-model="newAddOn.title"
              label="Add-On Title *"
              hint="e.g. Advanced ECG Diagnostics, Practice SAT Booklet"
              outlined
              dense
              :rules="[val => !!val && val.trim().length > 0 || 'Add-on title is required']"
            />
            <q-input
              v-model="newAddOn.description"
              label="Description"
              type="textarea"
              outlined
              dense
              rows="2"
            />
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model.number="newAddOn.price"
                  label="Price ($) *"
                  type="number"
                  prefix="$"
                  step="0.01"
                  outlined
                  dense
                  :rules="[val => val !== null && val >= 0 || 'Valid price required']"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="newAddOn.duration_minutes"
                  label="Extra Time (mins)"
                  type="number"
                  suffix="mins"
                  step="5"
                  outlined
                  dense
                />
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn elevated label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn type="submit" label="Create Add-On" color="accent" no-caps elevated :loading="submitting" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- MODAL 4: ADD SPECIALIZATION -->
    <q-dialog v-model="showSpecModal" persistent>
      <q-card style="min-width: 420px; border-radius: 14px">
        <q-card-section class="row items-center justify-between bg-positive text-white">
          <div class="text-h6 text-weight-bold">Add Specialization</div>
          <q-btn elevated round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="submitAddSpec" class="q-gutter-md">
            <q-select
              v-model="newSpec.category_id"
              :options="categorySelectOptions"
              label="Category *"
              outlined
              dense
              emit-value
              map-options
              :rules="[val => !!val || 'Category is required']"
            />
            <q-input
              v-model="newSpec.name"
              label="Specialization Name *"
              hint="e.g. Cardiology, SAT / ACT Prep, Deep Tissue Therapy"
              outlined
              dense
              :rules="[val => !!val && val.trim().length > 0 || 'Specialization name is required']"
            />

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn elevated label="Cancel" color="grey-7" v-close-popup no-caps />
              <q-btn type="submit" label="Create Specialization" color="positive" no-caps elevated :loading="submitting" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { appointmentService } from '../services/appointmentService';

interface CategoryItem {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

interface ServiceItem {
  id: number;
  category_id: number;
  specialization_id?: number | null;
  title: string;
  base_price: number;
  duration_minutes: number;
  category_name?: string;
  specialization_name?: string;
}

interface AddOnItem {
  id: number;
  category_id?: number | null;
  title: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  category_name?: string;
}

interface SpecializationItem {
  id: number;
  category_id: number;
  name: string;
  category_name?: string;
}

interface AdminAppointmentItem {
  id: number;
  client_name: string;
  provider_name: string;
  category_name?: string;
  service_title: string;
  start_time: string;
  status: string;
  total_amount: number;
}

const router = useRouter();

const activeTab = ref('categories');
const submitting = ref(false);
const feedbackMsg = ref('');
const feedbackIsError = ref(false);

const categories = ref<CategoryItem[]>([]);
const services = ref<ServiceItem[]>([]);
const addOns = ref<AddOnItem[]>([]);
const specializations = ref<SpecializationItem[]>([]);
const adminAppointments = ref<AdminAppointmentItem[]>([]);

// Modals
const showCategoryModal = ref(false);
const showServiceModal = ref(false);
const showAddOnModal = ref(false);
const showSpecModal = ref(false);

// Forms
const newCategory = ref({ name: '', description: '', icon: 'event' });
const newService = ref({ category_id: null as number | null, specialization_id: null as number | null, title: '', base_price: 50.00, duration_minutes: 60 });
const newAddOn = ref({ category_id: null as number | null, title: '', description: '', price: 20.00, duration_minutes: 0 });
const newSpec = ref({ category_id: null as number | null, name: '' });

const iconOptions = [
  { label: 'Medical / Healthcare (medical_services)', value: 'medical_services' },
  { label: 'Spa / Wellness (spa)', value: 'spa' },
  { label: 'Business / Consulting (business_center)', value: 'business_center' },
  { label: 'School / Education (school)', value: 'school' },
  { label: 'Fitness & Gym (fitness_center)', value: 'fitness_center' },
  { label: 'Salon & Barber (content_cut)', value: 'content_cut' },
  { label: 'General Event / Service (event)', value: 'event' },
  { label: 'Legal & Justice (gavel)', value: 'gavel' },
  { label: 'Dental & Teeth (clean_hands)', value: 'clean_hands' },
  { label: 'Tech & IT Support (computer)', value: 'computer' },
];

const categorySelectOptions = computed(() => {
  return categories.value.map(c => ({ label: c.name, value: c.id }));
});

const categorySelectOptionsWithGlobal = computed(() => {
  return [
    { label: 'Global (All Categories)', value: null },
    ...categories.value.map(c => ({ label: c.name, value: c.id }))
  ];
});

const filteredSpecOptions = computed(() => {
  if (!newService.value.category_id) return [];
  return specializations.value
    .filter(s => s.category_id === newService.value.category_id)
    .map(s => ({ label: s.name, value: s.id }));
});

// Columns
const serviceColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'title', label: 'Service Title', field: 'title', align: 'left' as const, sortable: true },
  { name: 'category_name', label: 'Category', field: 'category_name', align: 'left' as const, sortable: true },
  { name: 'specialization_name', label: 'Specialization', field: 'specialization_name', align: 'left' as const },
  { name: 'base_price', label: 'Base Price ($)', field: 'base_price', align: 'right' as const, sortable: true },
  { name: 'duration_minutes', label: 'Duration', field: 'duration_minutes', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const }
];

const addOnColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
  { name: 'title', label: 'Add-On Title', field: 'title', align: 'left' as const },
  { name: 'description', label: 'Description', field: 'description', align: 'left' as const },
  { name: 'category_name', label: 'Scope / Category', field: 'category_name', align: 'left' as const },
  { name: 'price', label: 'Price ($)', field: 'price', align: 'right' as const },
  { name: 'duration_minutes', label: 'Extra Time', field: 'duration_minutes', align: 'center' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const }
];

const specColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
  { name: 'name', label: 'Specialization Name', field: 'name', align: 'left' as const },
  { name: 'category_name', label: 'Category', field: 'category_name', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const }
];

const apptColumns = [
  { name: 'id', label: 'Appt ID', field: 'id', align: 'left' as const },
  { name: 'client_name', label: 'Client', field: 'client_name', align: 'left' as const },
  { name: 'provider_name', label: 'Specialist', field: 'provider_name', align: 'left' as const },
  { name: 'category_name', label: 'Category', field: 'category_name', align: 'left' as const },
  { name: 'service_title', label: 'Service', field: 'service_title', align: 'left' as const },
  { name: 'start_time', label: 'Start Time', field: 'start_time', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const },
  { name: 'total_amount', label: 'Total Paid', field: 'total_amount', align: 'right' as const }
];

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

const loadAllData = async () => {
  try {
    const [cats, svcs, addOnsData, specs, appts] = await Promise.all([
      appointmentService.getCategories(),
      appointmentService.getServices(),
      appointmentService.getAvailableAddOns(),
      appointmentService.getSpecializations(),
      appointmentService.getAdminAppointments()
    ]);
    categories.value = cats;
    services.value = svcs;
    addOns.value = addOnsData;
    specializations.value = specs;
    adminAppointments.value = appts;
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to load system data', true);
  }
};

onMounted(() => {
  void loadAllData();
});

const showFeedback = (msg: string, isError = false) => {
  feedbackMsg.value = msg;
  feedbackIsError.value = isError;
};

const getCategoryServicesCount = (catId: number) => {
  return services.value.filter(s => s.category_id === catId).length;
};

const getCategoryAddOnsCount = (catId: number) => {
  return addOns.value.filter(a => a.category_id === catId).length;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'positive';
    case 'confirmed': return 'primary';
    case 'cancelled': return 'negative';
    case 'blocked': return 'grey-7';
    default: return 'warning';
  }
};

// CREATE HANDLERS
const submitAddCategory = async () => {
  submitting.value = true;
  try {
    const res = await appointmentService.addCategory(newCategory.value);
    showFeedback(res.message || 'Category created successfully!');
    showCategoryModal.value = false;
    newCategory.value = { name: '', description: '', icon: 'event' };
    await loadAllData();
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to create category', true);
  } finally {
    submitting.value = false;
  }
};

const submitAddService = async () => {
  submitting.value = true;
  try {
    if (!newService.value.category_id) throw new Error('Category is required');
    const res = await appointmentService.addService({
      category_id: newService.value.category_id,
      specialization_id: newService.value.specialization_id,
      title: newService.value.title,
      base_price: newService.value.base_price,
      duration_minutes: newService.value.duration_minutes
    });
    showFeedback(res.message || 'Service created successfully!');
    showServiceModal.value = false;
    newService.value = { category_id: null, specialization_id: null, title: '', base_price: 50.00, duration_minutes: 60 };
    await loadAllData();
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to create service', true);
  } finally {
    submitting.value = false;
  }
};

const submitAddAddOn = async () => {
  submitting.value = true;
  try {
    const res = await appointmentService.addAddOn(newAddOn.value);
    showFeedback(res.message || 'Add-on created successfully!');
    showAddOnModal.value = false;
    newAddOn.value = { category_id: null, title: '', description: '', price: 20.00, duration_minutes: 0 };
    await loadAllData();
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to create add-on', true);
  } finally {
    submitting.value = false;
  }
};

const submitAddSpec = async () => {
  submitting.value = true;
  try {
    if (!newSpec.value.category_id) throw new Error('Category is required');
    const res = await appointmentService.addSpecialization({
      category_id: newSpec.value.category_id,
      name: newSpec.value.name
    });
    showFeedback(res.message || 'Specialization created successfully!');
    showSpecModal.value = false;
    newSpec.value = { category_id: null, name: '' };
    await loadAllData();
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to create specialization', true);
  } finally {
    submitting.value = false;
  }
};

// DELETE HANDLERS
const confirmDeleteCategory = async (cat: CategoryItem) => {
  if (confirm(`Are you sure you want to delete category "${cat.name}"? This will also remove related services, specializations, and add-ons.`)) {
    try {
      await appointmentService.deleteCategory(cat.id);
      showFeedback(`Category "${cat.name}" deleted successfully.`);
      await loadAllData();
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err) || 'Failed to delete category', true);
    }
  }
};

const confirmDeleteService = async (svc: ServiceItem) => {
  if (confirm(`Are you sure you want to delete service "${svc.title}"?`)) {
    try {
      await appointmentService.deleteService(svc.id);
      showFeedback(`Service "${svc.title}" deleted successfully.`);
      await loadAllData();
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err) || 'Failed to delete service', true);
    }
  }
};

const confirmDeleteAddOn = async (ao: AddOnItem) => {
  if (confirm(`Are you sure you want to delete add-on "${ao.title}"?`)) {
    try {
      await appointmentService.deleteAddOn(ao.id);
      showFeedback(`Add-on "${ao.title}" deleted successfully.`);
      await loadAllData();
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err) || 'Failed to delete add-on', true);
    }
  }
};

const confirmDeleteSpec = async (spec: SpecializationItem) => {
  if (confirm(`Are you sure you want to delete specialization "${spec.name}"?`)) {
    try {
      await appointmentService.deleteSpecialization(spec.id);
      showFeedback(`Specialization "${spec.name}" deleted successfully.`);
      await loadAllData();
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err) || 'Failed to delete specialization', true);
    }
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  void router.push('/');
};
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
}

.border-top {
  border-top: 1px solid #e0e0e0;
}

.opacity-80 {
  opacity: 0.85;
}

.hover-shadow {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-shadow:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
}
</style>
