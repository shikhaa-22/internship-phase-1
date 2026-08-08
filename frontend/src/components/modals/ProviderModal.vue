<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 480px; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-deep-orange text-white">
        <div class="text-h6 text-weight-bold">Add New Service Provider</div>
        <q-btn elevated round dense icon="close" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pa-md">
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Provider Name *"
            hint="e.g., Sarah Jenkins, Dr. Alex Smith"
            outlined
            dense
            :rules="[val => !!val && val.trim().length > 0 || 'Name is required']"
          />

          <q-input
            v-model="form.email"
            label="Email Address *"
            hint="Provider's login email"
            type="email"
            outlined
            dense
            :rules="[val => !!val && val.trim().length > 0 || 'Email is required']"
          />

          <q-input
            v-model="form.password"
            label="Account Password"
            hint="Default: provider123 if left blank"
            type="password"
            outlined
            dense
          />

          <q-select
            v-model="form.category_id"
            :options="categoryOptions"
            label="Primary Category *"
            outlined
            dense
            emit-value
            map-options
            :rules="[val => !!val || 'Category is required']"
            @update:model-value="form.specialization_id = null"
          />

          <q-select
            v-model="form.specialization_id"
            :options="filteredProviderSpecOptions"
            label="Specialization (Optional)"
            outlined
            dense
            emit-value
            map-options
            clearable
            hint="Filter specializations by selecting a category first"
          />

          <q-select
            v-model="form.seniority_level"
            :options="seniorityOptions"
            label="Seniority Tier *"
            outlined
            dense
            emit-value
            map-options
          />

          <q-input
            v-model.number="form.consultation_fee"
            label="Base Service Fee / Rate ($) *"
            type="number"
            prefix="$"
            step="0.01"
            outlined
            dense
            :rules="[val => val !== null && val >= 0 || 'Fee must be a non-negative number']"
          />

          <q-input
            v-model="form.bio"
            label="Bio / Notes (Optional)"
            hint="Brief description of experience or credentials"
            type="textarea"
            outlined
            dense
            rows="2"
          />

          <div class="row justify-end q-gutter-sm q-mt-lg">
            <q-btn elevated label="Cancel" color="grey-7" v-close-popup no-caps />
            <q-btn type="submit" label="Add Provider" color="deep-orange" no-caps elevated :loading="submitting" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { appointmentService } from '../../services/appointmentService';

interface CategoryOption {
  label: string;
  value: number;
}

interface SpecializationItem {
  id: number;
  category_id: number;
  name: string;
}

interface SeniorityOption {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue: boolean;
  categoryOptions: CategoryOption[];
  specializations: SpecializationItem[];
  seniorityOptions: SeniorityOption[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}>();

const submitting = ref(false);
const form = ref({
  name: '',
  email: '',
  password: 'provider123',
  category_id: null as number | null,
  specialization_id: null as number | null,
  seniority_level: 'senior',
  consultation_fee: 100.0,
  bio: '',
});

const filteredProviderSpecOptions = computed(() => {
  if (!form.value.category_id) return [];
  return props.specializations
    .filter(s => s.category_id === form.value.category_id)
    .map(s => ({ label: s.name, value: s.id }));
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    if (!form.value.category_id) throw new Error('Category is required');
    const res = await appointmentService.addProvider({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password || 'provider123',
      category_id: form.value.category_id,
      specialization_id: form.value.specialization_id,
      seniority_level: form.value.seniority_level,
      consultation_fee: form.value.consultation_fee,
      bio: form.value.bio,
    });
    emit('success', res.message || 'Service provider added successfully!');
    emit('update:modelValue', false);
    form.value = {
      name: '',
      email: '',
      password: 'provider123',
      category_id: null,
      specialization_id: null,
      seniority_level: 'senior',
      consultation_fee: 100.0,
      bio: '',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add service provider';
    emit('error', msg);
  } finally {
    submitting.value = false;
  }
};
</script>
