<template>
  <q-page class="row items-center justify-center bg-slate-100 q-pa-md">
    <div style="width: 100%; max-width: 550px;">
      <q-card
        elevated
        bordered
        class="q-pa-lg bg-white border-slate shadow-3"
        style="border-radius: 16px"
      >
        <!-- Logo & Header -->
        <q-card-section class="text-center q-pb-none">
          <q-avatar
            size="56px"
            color="primary"
            text-color="white"
            icon="event_note"
            class="q-mb-sm shadow-1"
          />
          <div style="height: 10px;"></div>
          
          <div class="text-h5 text-weight-bold text-slate-900">Multi-Category Booking Platform</div>
          <div class="text-body2 text-slate-600 q-mt-xs">
            Sign in to book & manage Doctor, Wellness, and Consulting appointments
          </div>
          <div style="height: 20px;"></div>
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
                <q-icon name="email" color="primary" />
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
                <q-icon name="lock" color="primary" />
              </template>
              <template #append>
                <q-icon
                  :name="isPwdVisible ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwdVisible = !isPwdVisible"
                />
              </template>
            </q-input>
            <div style="height: 5px;"></div>
          
            <q-btn
              label="Sign In to Dashboard"
              type="submit"
              color="primary"
              class="full-width q-py-sm text-subtitle2 text-weight-bold"
              :loading="loading"
              unelevated
              no-caps
              style="border-radius: 8px"
            />
          </q-form>

          <q-separator class="q-my-md" />

          <!-- Demo Quick Logins -->
          <div class="text-caption text-weight-bold text-grey-7 text-center q-mb-sm">
            QUICK DEMO LOGINS
          </div>
          <div class="row q-col-gutter-xs justify-center">
            <div class="col-auto">
              <q-btn size="sm" outline color="primary" label="Client (Shikhaa)" no-caps @click="fillCredentials('shikha@example.com', 'hashed_pass_123')" />
            </div>
            <div class="col-auto">
              <q-btn size="sm" outline color="teal" label="Doctor (Dr. Smith)" no-caps @click="fillCredentials('drsmith@example.com', 'hashed_pass_123')" />
            </div>
            <div class="col-auto">
              <q-btn size="sm" outline color="deep-orange" label="Wellness (Marcus)" no-caps @click="fillCredentials('marcus@example.com', 'hashed_pass_123')" />
            </div>
            <div class="col-auto">
              <q-btn size="sm" outline color="indigo" label="Consultant (Sarah)" no-caps @click="fillCredentials('sarah@example.com', 'hashed_pass_123')" />
            </div>
            <div class="col-auto">
              <q-btn size="sm" outline color="indigo" label="Admin (admin)" no-caps @click="fillCredentials('admin@example.com', 'hashed_pass_123')" />
            </div>
          </div>
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

const fillCredentials = (demoEmail: string, demoPass: string) => {
  email.value = demoEmail;
  password.value = demoPass;
  void handleLogin();
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
