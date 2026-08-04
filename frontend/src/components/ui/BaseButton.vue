<template>
  <q-btn
    :label="label"
    :icon="icon"
    :color="color || 'primary'"
    :unelevated="unelevated"
    :flat="flat"
    :outline="outline"
    class="base-btn q-px-md"
    no-caps
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
interface Props {
  label?: string;
  icon?: string;
  color?: string;
  unelevated?: boolean;
  flat?: boolean;
  outline?: boolean;
}

withDefaults(defineProps<Props>(), {
  label: '',
  icon: '',
  color: 'primary',
  unelevated: true,
  flat: false,
  outline: false,
});
</script>

<style scoped>
.base-btn {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: all 0.2s ease-in-out;
}
</style>
