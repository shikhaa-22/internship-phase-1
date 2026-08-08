<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 450px; border-radius: 14px">
      <q-card-section class="row items-center justify-between bg-accent text-white">
        <div class="text-h6 text-weight-bold">Add New Add-On Amenity / Diagnostic Test</div>
        <q-btn elevated round dense icon="close" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pa-md">
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-select
            v-model="form.category_id"
            :options="categoryOptionsWithGlobal"
            label="Target Category Scope"
            outlined
            dense
            emit-value
            map-options
            hint="Select 'Global' to apply to all categories, or pick a specific category"
          />
          <q-input
            v-model="form.title"
            label="Add-On Title *"
            hint="e.g., Express Blood Panel, VIP Refreshment Lounge, Printed Report"
            outlined
            dense
            :rules="[val => !!val && val.trim().length > 0 || 'Title is required']"
          />
          <q-input
            v-model="form.description"
            label="Description"
            type="textarea"
            outlined
            dense
            rows="2"
          />
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.price"
                label="Price ($) *"
                type="number"
                prefix="$"
                step="0.01"
                outlined
                dense
                :rules="[val => val !== null && val >= 0 || 'Price required']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.duration_minutes"
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { appointmentService } from '../../services/appointmentService';

interface CategoryOptionWithGlobal {
  label: string;
  value: number | null;
}

defineProps<{
  modelValue: boolean;
  categoryOptionsWithGlobal: CategoryOptionWithGlobal[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', message: string): void;
  (e: 'error', message: string): void;
}>();

const submitting = ref(false);
const form = ref({
  category_id: null as number | null,
  title: '',
  description: '',
  price: 20.0,
  duration_minutes: 0,
});

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const res = await appointmentService.addAddOn(form.value);
    emit('success', res.message || 'Add-on created successfully!');
    emit('update:modelValue', false);
    form.value = {
      category_id: null,
      title: '',
      description: '',
      price: 20.0,
      duration_minutes: 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create add-on';
    emit('error', msg);
  } finally {
    submitting.value = false;
  }
};
</script>
