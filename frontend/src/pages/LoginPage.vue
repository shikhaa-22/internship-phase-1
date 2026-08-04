<template>
  <q-page class="row items-center justify-center bg-grey-2">
    <q-card flat bordered class="q-pa-lg shadow-2" style="width: 400px; border-radius: 12px">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold text-primary">Appointment System</div>
        <div class="text-subtitle2 text-grey-7">Sign in to your account</div>
      </q-card-section>

      <q-card-section>
        <q-banner
          v-if="errorMessage"
          dense
          class="bg-red-1 text-negative q-mb-md"
          style="border-radius: 6px"
        >
          {{ errorMessage }}
        </q-banner>

        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input v-model="email" type="email" label="Email Address" outlined dense required />

          <q-input
            v-model="password"
            :type="isPwdVisible ? 'text' : 'password'"
            label="Password"
            outlined
            dense
            required
          >
            <template #append>
              <q-icon
                :name="isPwdVisible ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwdVisible = !isPwdVisible"
              />
            </template>
          </q-input>

          <q-btn
            label="Login"
            type="submit"
            color="primary"
            class="full-width q-py-sm"
            :loading="loading"
            unelevated
            no-caps
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const { email, password, loading, errorMessage, handleLogin } = useAuth();
const isPwdVisible = ref(false);
</script>
