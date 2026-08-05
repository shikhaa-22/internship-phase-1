<template>
  <q-page class="row items-center justify-center bg-slate-100 q-pa-md">
    <div style="width: 100%; max-width: 440px">
      <q-card
        flat
        bordered
        class="q-pa-lg bg-white border-slate shadow-3"
        style="border-radius: 16px"
      >
        <!-- Logo & Header -->
        <q-card-section class="text-center q-pb-none">
          <q-avatar
            size="56px"
            color="blue-7"
            text-color="white"
            icon="medical_services"
            class="q-mb-sm shadow-1"
          />
          <div class="text-h5 text-weight-bold text-slate-900">Healthcare Portal</div>
          <div class="text-body2 text-slate-600 q-mt-xs">
            Sign in to manage appointments & records
          </div>
        </q-card-section>

        <!-- Quick Demo Account Selector -->
        <q-card-section class="q-py-md">
          <div class="text-caption text-slate-500 text-weight-bold text-center q-mb-xs">
            QUICK DEMO LOGIN
          </div>
          <div class="row q-gutter-xs justify-center">
            <q-chip
              clickable
              color="blue-1"
              text-color="blue-9"
              icon="medical_services"
              class="text-weight-bold"
              @click="fillDemoAccount('doctor')"
            >
              Doctor
            </q-chip>
            <q-chip
              clickable
              color="green-1"
              text-color="green-9"
              icon="person"
              class="text-weight-bold"
              @click="fillDemoAccount('patient')"
            >
              Patient
            </q-chip>
            <q-chip
              clickable
              color="purple-1"
              text-color="purple-9"
              icon="admin_panel_settings"
              class="text-weight-bold"
              @click="fillDemoAccount('admin')"
            >
              Admin
            </q-chip>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Error Banner -->
          <q-banner
            v-if="errorMessage"
            dense
            inline-actions
            class="bg-red-50 text-red-8 border-red-soft q-mb-md rounded-borders"
          >
            <template #avatar>
              <q-icon name="error_outline" color="red-7" size="sm" />
            </template>
            {{ errorMessage }}
          </q-banner>

          <!-- Login Form -->
          <q-form @submit.prevent="handleLogin" class="column q-gutter-y-md">
            <q-input
              v-model="email"
              type="email"
              label="Email Address"
              outlined
              dense
              required
              class="text-body1"
            >
              <template #prepend>
                <q-icon name="email" color="blue-7" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              :type="isPwdVisible ? 'text' : 'password'"
              label="Password"
              outlined
              dense
              required
              class="text-body1"
            >
              <template #prepend>
                <q-icon name="lock" color="blue-7" />
              </template>
              <template #append>
                <q-icon
                  :name="isPwdVisible ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwdVisible = !isPwdVisible"
                />
              </template>
            </q-input>

            <q-btn
              label="Sign In to Dashboard"
              type="submit"
              color="blue-7"
              class="full-width q-py-sm text-subtitle2 text-weight-bold"
              :loading="loading"
              unelevated
              no-caps
              style="border-radius: 8px"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const { email, password, loading, errorMessage, handleLogin } = useAuth();
const isPwdVisible = ref(false);

const fillDemoAccount = (role: 'doctor' | 'patient' | 'admin') => {
  if (role === 'doctor') {
    email.value = 'drsmith@example.com';
    password.value = 'hashed_pass_123';
  } else if (role === 'patient') {
    email.value = 'shikha@example.com';
    password.value = 'hashed_pass_123';
  } else if (role === 'admin') {
    email.value = 'admin@example.com';
    password.value = 'hashed_pass_123';
  }
};
</script>

<style scoped>
.border-slate {
  border: 1px solid #e2e8f0;
}

.border-red-soft {
  border-left: 4px solid #dc2626;
  border-top: 1px solid #fecaca;
  border-right: 1px solid #fecaca;
  border-bottom: 1px solid #fecaca;
}
</style>
