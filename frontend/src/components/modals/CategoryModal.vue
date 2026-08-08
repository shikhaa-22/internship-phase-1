<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 420px; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-primary text-white">
        <div class="text-h6 text-weight-bold">Add New Appointment Category</div>
        <q-btn elevated round dense icon="close" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pa-md">
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Category Name *"
            hint="e.g., Education & Tutoring, Legal Advisory, Fitness"
            outlined
            dense
            :rules="[val => !!val && val.trim().length > 0 || 'Category name is required']"
          />
          <q-input
            v-model="form.description"
            label="Description"
            type="textarea"
            outlined
            dense
            rows="3"
            hint="Brief summary of category services"
          />
          <q-select
            v-model="form.icon"
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
              <q-icon :name="form.icon || 'event'" color="primary" />
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { appointmentService } from '../../services/appointmentService';

interface IconOption {
  label: string;
  value: string;
}

defineProps<{
  modelValue: boolean;
  iconOptions: IconOption[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}>();

const submitting = ref(false);
const form = ref({
  name: '',
  description: '',
  icon: 'event',
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const res = await appointmentService.addCategory(form.value);
    emit('success', res.message || 'Category created successfully!');
    emit('update:modelValue', false);
    form.value = { name: '', description: '', icon: 'event' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create category';
    emit('error', msg);
  } finally {
    submitting.value = false;
  }
};
</script>
