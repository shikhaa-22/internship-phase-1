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
          <q-btn color="negative" style="border-radius: 8px;" icon="logout" label="Logout" no-caps @click="handleLogout" />
        </div>
      </q-card-section>
      
      <!-- Quick Metrics Ribbon -->

    </q-card>
    <div style="height: 15px;"></div>
    <q-card elevated  class="q-mb-md shadow-2 bg-gradient-primary text-white" style="border-radius: 14px">
      <q-card-section class="row items-center justify-between q-pa-lg bg-white text-primary" >
        <div class="col-xs-6 col-sm-2">
          <div class="row items-center q-gutter-sm">
            <q-icon name="category" color="primary" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">CATEGORIES</div>
              <div class="text-h6 text-weight-bolder text-primary">{{ categories.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-2">
          <div class="row items-center q-gutter-sm">
            <q-icon name="psychology" color="positive" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">SPECIALIZATIONS</div>
              <div class="text-h6 text-weight-bolder text-positive">{{ specializations.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-2">
          <div class="row items-center q-gutter-sm">
            <q-icon name="room_service" color="secondary" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">SERVICES</div>
              <div class="text-h6 text-weight-bolder text-secondary">{{ services.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-2">
          <div class="row items-center q-gutter-sm">
            <q-icon name="extension" color="accent" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">ADD-ONS</div>
              <div class="text-h6 text-weight-bolder text-accent">{{ addOns.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-xs-6 col-sm-2">
          <div class="row items-center q-gutter-sm">
            <q-icon name="badge" color="deep-orange" size="28px" />
            <div>
              <div class="text-caption text-grey-7 text-weight-bold">PROVIDERS</div>
              <div class="text-h6 text-weight-bolder text-deep-orange">{{ providers.length }}</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div style="height: 15px;"></div>
      
    <!-- Navigation Tabs Bar -->
    <div class="q-mb-md">
      <q-tabs v-model="activeTab" dense active-color="primary" indicator-color="primary" align="left" class="bg-white shadow-1" style="border-radius: 10px; padding: 4px;">
        <q-tab name="providers" icon="badge" label="Providers & Staff" no-caps />
        <q-tab name="categories" icon="category" label="Categories" no-caps />
        <q-tab name="specializations" icon="psychology" label="Specializations" no-caps />
        <q-tab name="services" icon="room_service" label="Services (Prices & Duration)" no-caps />
        <q-tab name="add_ons" icon="extension" label="Add-Ons" no-caps />
        <q-tab name="seniority" icon="military_tech" label="Seniority Tiers" no-caps />
        <q-tab name="appointments" icon="event_note" label="Appointments" no-caps />
      </q-tabs>
    </div>
    
    <!-- Feedback Message Banner -->
    <q-banner
      v-if="feedbackMsg"
      dense
      :class="feedbackIsError ? 'bg-negative text-white' : 'bg-positive text-white'"
      class="q-mb-sm shadow-1"
      style="border-radius: 8px"
    >
      <div class="row items-center justify-between q-py-xs">
        <div class="row items-center q-gutter-sm">
          <q-icon :name="feedbackIsError ? 'error' : 'check_circle'" color="white" size="20px" />
          <span class="text-weight-medium text-body2">{{ feedbackMsg }}</span>
        </div>
        <q-btn elevated style="border-radius: 8px" text-color="black" color="white" label="Dismiss" no-caps size="sm" class="text-weight-bold" @click="feedbackMsg = ''" />
      </div>
    </q-banner>

    <div style="height: 20px;"></div>

    <!-- TAB 0: PROVIDERS & STAFF -->
    <div v-if="activeTab === 'providers'">
      <q-card elevated bordered class="shadow-1 q-mb-md" style="border-radius: 12px">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold text-deep-orange">Managed Service Providers & Staff</div>
            <div class="text-caption text-grey-7">Add, view, and manage service providers, specialists, and staff profiles</div>
          </div>
          <q-btn color="deep-orange" icon="add" label="Add Provider / Staff" no-caps elevated style="border-radius: 8px" @click="showProviderModal = true" />
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md">
        <div v-for="doc in providers" :key="doc.id" class="col-xs-12 col-sm-6 col-md-4">
          <q-card elevated bordered class="shadow-1 hover-shadow" style="border-radius: 12px; height: 100%;">
            <q-card-section class="row items-center justify-between bg-deep-orange-1">
              <div class="row items-center q-gutter-sm">
                <q-avatar color="deep-orange" text-color="white" icon="badge" size="42px" class="shadow-1" />
                <div>
                  <div class="text-h6 text-weight-bold text-deep-orange-9">{{ doc.name }}</div>
                  <div class="text-caption text-grey-7">{{ doc.email }} • ID: #{{ doc.id }}</div>
                </div>
              </div>
              <q-btn color="negative" elevated round icon="delete" size="sm" @click="confirmDeleteProvider(doc)" />
            </q-card-section>
            <q-card-section class="q-pt-md">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7 text-weight-bold">Category:</span>
                <q-chip color="blue-1" text-color="blue-9" dense class="text-weight-bold">{{ doc.category_name || 'Unassigned' }}</q-chip>
              </div>
              <div class="row items-center justify-between q-mb-xs" v-if="doc.specialization_name">
                <span class="text-caption text-grey-7 text-weight-bold">Specialization:</span>
                <q-chip color="purple-1" text-color="purple-9" dense class="text-weight-bold">{{ doc.specialization_name }}</q-chip>
              </div>
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7 text-weight-bold">Seniority Level:</span>
                <q-chip :color="doc.tier_multiplier > 1.2 ? 'deep-orange' : (doc.tier_multiplier > 1.0 ? 'primary' : 'grey-7')" text-color="white" dense class="text-capitalize text-weight-bold">
                  {{ doc.seniority_level }} ({{ Number(doc.tier_multiplier).toFixed(2) }}x)
                </q-chip>
              </div>
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-grey-7 text-weight-bold">Fee / Rate:</span>
                <span class="text-weight-bold text-green-9 text-body1">${{ Number(doc.consultation_fee || 100).toFixed(2) }}</span>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- TAB 1: CATEGORIES -->
    <div v-if="activeTab === 'categories'">
      <q-card elevated bordered class="shadow-1 q-mb-md" style="border-radius: 12px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold text-primary">Managed Appointment Categories</div>
          <q-btn color="primary" icon="add" label="Add Category" no-caps elevated style="border-radius: 8px" @click="showCategoryModal = true" />
        </q-card-section>
      </q-card>
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
            <template #body-cell-seniority_level="props">
              <q-td :props="props">
                <q-select
                  v-model="props.row.seniority_level"
                  :options="seniorityOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  style="min-width: 250px"
                  @update:model-value="(val) => changeSpecSeniority(props.row.id, val)"
                />
              </q-td>
            </template>
            <template #body-cell-tier_multiplier="props">
              <q-td :props="props" align="center">
                <q-chip :color="props.value > 1.2 ? 'deep-orange' : (props.value > 1.0 ? 'positive' : 'grey-7')" text-color="white" class="text-weight-bold">
                  {{ Number(props.value || 1.15).toFixed(2) }}x (+{{ Math.round(((Number(props.value || 1.15)) - 1) * 100) }}%)
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" align="center">
                <q-btn color="negative" elevated round icon="delete" size="sm" @click="confirmDeleteSpec(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- TAB: SPECIALIST SENIORITY TIERS -->
    <div v-if="activeTab === 'seniority'">
      <q-card elevated bordered class="shadow-1" style="border-radius: 12px">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold text-primary">Specialist Seniority Levels & Dynamic Pricing Tiers</div>
            <div class="text-subtitle2 text-grey-7">Select a specialist's seniority level to dynamically adjust their pricing multiplier in the booking engine</div>
          </div>
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-table
            elevated
            bordered
            :rows="providers"
            :columns="providerColumns"
            row-key="id"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-seniority_level="props">
              <q-td :props="props">
                <q-select
                  v-model="props.row.seniority_level"
                  :options="seniorityOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  style="min-width: 280px"
                  @update:model-value="(val) => changeProviderSeniority(props.row.id, val)"
                />
              </q-td>
            </template>
            <template #body-cell-tier_multiplier="props">
              <q-td :props="props" align="center">
                <q-chip :color="props.value > 1.2 ? 'deep-orange' : (props.value > 1.0 ? 'primary' : 'grey-7')" text-color="white" class="text-weight-bold">
                  {{ Number(props.value || 1).toFixed(2) }}x (+{{ Math.round(((Number(props.value || 1)) - 1) * 100) }}% adjustment)
                </q-chip>
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

    <CategoryModal
      v-model="showCategoryModal"
      :icon-options="iconOptions"
      @success="handleModalSuccess"
      @error="handleModalError"
    />

    <ServiceModal
      v-model="showServiceModal"
      :category-options="categorySelectOptions"
      :specializations="specializations"
      @success="handleModalSuccess"
      @error="handleModalError"
    />

    <AddOnModal
      v-model="showAddOnModal"
      :category-options-with-global="categorySelectOptionsWithGlobal"
      @success="handleModalSuccess"
      @error="handleModalError"
    />

    <SpecializationModal
      v-model="showSpecModal"
      :category-options="categorySelectOptions"
      @success="handleModalSuccess"
      @error="handleModalError"
    />

    <ProviderModal
      v-model="showProviderModal"
      :category-options="categorySelectOptions"
      :specializations="specializations"
      :seniority-options="seniorityOptions"
      @success="handleModalSuccess"
      @error="handleModalError"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { appointmentService } from '../services/appointmentService';
import CategoryModal from '../components/modals/CategoryModal.vue';
import ServiceModal from '../components/modals/ServiceModal.vue';
import AddOnModal from '../components/modals/AddOnModal.vue';
import SpecializationModal from '../components/modals/SpecializationModal.vue';
import ProviderModal from '../components/modals/ProviderModal.vue';

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

interface ProviderItem {
  id: number;
  name: string;
  email: string;
  role: string;
  category_name?: string;
  specialization_name?: string;
  seniority_level: string;
  tier_multiplier: number;
  consultation_fee: number;
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

const activeTab = ref<string>('providers');
const feedbackMsg = ref('');
const feedbackIsError = ref(false);

const categories = ref<CategoryItem[]>([]);
const services = ref<ServiceItem[]>([]);
const addOns = ref<AddOnItem[]>([]);
const specializations = ref<SpecializationItem[]>([]);
const providers = ref<ProviderItem[]>([]);
const adminAppointments = ref<AdminAppointmentItem[]>([]);

const seniorityOptions = [
  { label: 'Junior Practitioner (1.00x Base)', value: 'junior' },
  { label: 'Senior Specialist (1.15x Tier)', value: 'senior' },
  { label: 'Lead Specialist / Chief (1.30x Tier)', value: 'lead_specialist' },
];

// Modals
const showProviderModal = ref(false);
const showCategoryModal = ref(false);
const showServiceModal = ref(false);
const showAddOnModal = ref(false);
const showSpecModal = ref(false);

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
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const }
];

const specColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
  { name: 'name', label: 'Specialization Name', field: 'name', align: 'left' as const },
  { name: 'category_name', label: 'Category', field: 'category_name', align: 'left' as const },
  { name: 'seniority_level', label: 'Fixed Seniority Tier', field: 'seniority_level', align: 'left' as const },
  { name: 'tier_multiplier', label: 'Pricing Multiplier', field: 'tier_multiplier', align: 'center' as const },
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

const providerColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
  { name: 'name', label: 'Specialist Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'category_name', label: 'Category', field: 'category_name', align: 'left' as const, sortable: true },
  { name: 'specialization_name', label: 'Fixed Specialization', field: 'specialization_name', align: 'left' as const },
  { name: 'seniority_level', label: 'Seniority Tier', field: 'seniority_level', align: 'left' as const },
  { name: 'tier_multiplier', label: 'Pricing Multiplier', field: 'tier_multiplier', align: 'center' as const }
];

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

const changeProviderSeniority = async (providerId: number, level: string) => {
  try {
    const res = await appointmentService.updateProviderSeniority(providerId, level);
    showFeedback(res.message || 'Seniority level updated successfully!');
    await loadAllData();
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to update seniority level', true);
  }
};

const changeSpecSeniority = async (specId: number, level: string) => {
  try {
    const res = await appointmentService.updateSpecializationSeniority(specId, level);
    showFeedback(res.message || 'Specialization tier updated successfully!');
    await loadAllData();
  } catch (err: unknown) {
    showFeedback(getErrorMessage(err) || 'Failed to update specialization tier', true);
  }
};

const loadAllData = async () => {
  try {
    const [cats, svcs, addOnsData, specs, appts, provs] = await Promise.all([
      appointmentService.getCategories(),
      appointmentService.getServices(),
      appointmentService.getAvailableAddOns(),
      appointmentService.getSpecializations(),
      appointmentService.getAdminAppointments(),
      appointmentService.getProviders()
    ]);
    categories.value = cats;
    services.value = svcs;
    addOns.value = addOnsData;
    specializations.value = specs;
    adminAppointments.value = appts;
    providers.value = provs;
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
  }
};

const handleModalSuccess = (msg: string) => {
  showFeedback(msg);
  void loadAllData();
};

const handleModalError = (msg: string) => {
  showFeedback(msg, true);
};

// DELETE HANDLERS
const confirmDeleteProvider = async (doc: ProviderItem) => {
  if (confirm(`Are you sure you want to remove service provider "${doc.name}"?`)) {
    try {
      await appointmentService.deleteProvider(doc.id);
      showFeedback(`Provider "${doc.name}" removed successfully.`);
      await loadAllData();
    } catch (err: unknown) {
      showFeedback(getErrorMessage(err) || 'Failed to remove provider', true);
    }
  }
};

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
