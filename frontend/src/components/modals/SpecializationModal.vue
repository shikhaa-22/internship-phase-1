<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 420px; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-positive text-white">
        <div class="text-h6 text-weight-bold">Add New Specialization</div>
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
          />
          <q-input
            v-model="form.name"
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { appointmentService } from '../../services/appointmentService';

interface CategoryOption {
  label: string;
  value: number;
}

defineProps<{
  modelValue: boolean;
  categoryOptions: CategoryOption[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}>();

const submitting = ref(false);
const form = ref({
  category_id: null as number | null,
  name: '',
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    if (!form.value.category_id) throw new Error('Category is required');
    const res = await appointmentService.addSpecialization({
      category_id: form.value.category_id,
      name: form.value.name,
    });
    emit('success', res.message || 'Specialization created successfully!');
    emit('update:modelValue', false);
    form.value = { category_id: null, name: '' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create specialization';
    emit('error', msg);
  } finally {
    submitting.value = false;
  }
};
</script>
