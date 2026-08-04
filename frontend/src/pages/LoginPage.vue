<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="q-pa-lg shadow-2" style="width: 400px; border-radius: 12px;">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold text-primary">Welcome Back</div>
            <div class="text-subtitle2 text-grey-7">Sign in to your account</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">
              <q-input
                v-model="email"
                label="Email Address"
                type="email"
                outlined
                dense
                required
              />

              <q-input
                v-model="password"
                label="Password"
                type="password"
                outlined
                dense
                required
              />

              <q-banner v-if="errorMessage" dense class="bg-red-2 text-red-9 q-mb-md">
                {{ errorMessage }}
              </q-banner>

              <div>
                <q-btn
                  label="Login"
                  type="submit"
                  color="primary"
                  class="full-width q-py-sm"
                  :loading="loading"
                  unelevated
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuth } from '../composables/useAuth';

const { email, password, loading, errorMessage, handleLogin } = useAuth();
</script>