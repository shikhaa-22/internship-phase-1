<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 450px; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-secondary text-white">
        <div class="text-h6 text-weight-bold">Add New Service (Price & Duration)</div>
        <q-btn elevated round dense icon="close" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pa-md">
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-select
            v-model="form.category_id"
            :options="categoryOptions"
            label="Category *"
            outlined
            dense
            emit-value
            map-options
            :rules="[val => !!val || 'Category is required']"
            @update:model-value="form.specialization_id = null"
          />
          <q-select
            v-model="form.specialization_id"
            :options="filteredSpecOptions"
            label="Specialization (Optional)"
            outlined
            dense
            emit-value
            map-options
            clearable
            hint="Filter specializations by selecting a category first"
          />
          <q-input
            v-model="form.title"
            label="Service Title *"
            hint="e.g. Haircut, Full Body Checkup, Math SAT Prep Session"
            outlined
            dense
            :rules="[val => !!val && val.trim().length > 0 || 'Service title is required']"
          />
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.base_price"
                label="Base Price ($) *"
                type="number"
                prefix="$"
                step="0.01"
                outlined
                dense
                :rules="[val => val !== null && val >= 0 || 'Valid price required']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.duration_minutes"
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

const props = defineProps<{
  modelValue: boolean;
  categoryOptions: CategoryOption[];
  specializations: SpecializationItem[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}>();

const submitting = ref(false);
const form = ref({
  category_id: null as number | null,
  specialization_id: null as number | null,
  title: '',
  base_price: 50.0,
  duration_minutes: 60,
});

const filteredSpecOptions = computed(() => {
  if (!form.value.category_id) return [];
  return props.specializations
    .filter(s => s.category_id === form.value.category_id)
    .map(s => ({ label: s.name, value: s.id }));
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    if (!form.value.category_id) throw new Error('Category is required');
    const res = await appointmentService.addService({
      category_id: form.value.category_id,
      specialization_id: form.value.specialization_id,
      title: form.value.title,
      base_price: form.value.base_price,
      duration_minutes: form.value.duration_minutes,
    });
    emit('success', res.message || 'Service created successfully!');
    emit('update:modelValue', false);
    form.value = {
      category_id: null,
      specialization_id: null,
      title: '',
      base_price: 50.0,
      duration_minutes: 60,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create service';
    emit('error', msg);
  } finally {
    submitting.value = false;
  }
};
</script>
