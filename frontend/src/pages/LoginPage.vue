<template>
  <q-page class="row items-center justify-center bg-slate-100 q-pa-md">
    <div style="width: 100%; max-width: 550px;">
      <q-card
        elevated
        bordered
        class="q-pa-lg bg-white border-slate shadow-3"
        style="border-radius: 16px"
      >
        <!-- Top Back Button inside Card -->
        <div class="row items-center q-mb-xs">
          <q-btn
            flat
            dense
            icon="arrow_back"
            label="Back to Home"
            color="primary"
            no-caps
            class="text-weight-bold"
            @click="goBack"
          />
        </div>

        <!-- Logo & Header -->
        <q-card-section class="text-center q-pb-none q-pt-xs">
          <q-avatar
            size="56px"
            color="primary"
            text-color="white"
            icon="shield"
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
          <!-- Auth Mode Toggle Tabs -->
          <q-tabs
            v-model="authTab"
            class="text-primary q-mb-md"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            dense
            @update:model-value="errorMessage = ''"
          >
            <q-tab name="login" label="Sign In" icon="login" no-caps class="text-weight-bold" />
            <q-tab name="register" label="Register as Client" icon="person_add_alt" no-caps class="text-weight-bold" />
          </q-tabs>

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

          <!-- MODE 1: SIGN IN FORM -->
          <q-form v-if="authTab === 'login'" @submit.prevent="handleLogin" class="column q-gutter-y-md">
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
                <q-icon name="alternate_email" color="primary" />
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
                <q-icon name="vpn_key" color="primary" />
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

          <!-- MODE 2: CLIENT REGISTRATION FORM -->
          <q-form v-else @submit.prevent="handleClientRegister" class="column q-gutter-y-md">
            

            <q-input
              v-model="regName"
              type="text"
              label="Full Name *"
              hint="e.g. Jane Doe"
              outlined
              dense
              required
              class="text-body1"
            >
              <template #prepend>
                <q-icon name="person" color="primary" />
              </template>
            </q-input>

            <q-input
              v-model="regEmail"
              type="email"
              label="Email Address *"
              hint="Your login email"
              outlined
              dense
              required
              class="text-body1"
            >
              <template #prepend>
                <q-icon name="alternate_email" color="primary" />
              </template>
            </q-input>

            <q-input
              v-model="regPassword"
              :type="isRegPwdVisible ? 'text' : 'password'"
              label="Password *"
              outlined
              dense
              required
              class="text-body1"
            >
              <template #prepend>
                <q-icon name="vpn_key" color="primary" />
              </template>
              <template #append>
                <q-icon
                  :name="isRegPwdVisible ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isRegPwdVisible = !isRegPwdVisible"
                />
              </template>
            </q-input>

            <q-input
              v-model="regConfirmPassword"
              :type="isRegPwdVisible ? 'text' : 'password'"
              label="Confirm Password *"
              outlined
              dense
              required
              class="text-body1"
            >
              <template #prepend>
                <q-icon name="lock_reset" color="primary" />
              </template>
            </q-input>
            <div style="height: 5px;"></div>

            <q-btn
              label="Create Client Account"
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
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const route = useRoute();
const authTab = ref<'login' | 'register'>('login');

onMounted(() => {
  if (route.path.includes('register') || route.query.tab === 'register') {
    authTab.value = 'register';
  } else {
    authTab.value = 'login';
  }
});
const {
  email,
  password,
  regName,
  regEmail,
  regPassword,
  regConfirmPassword,
  loading,
  errorMessage,
  handleLogin,
  handleClientRegister,
} = useAuth();

const isPwdVisible = ref(false);
const isRegPwdVisible = ref(false);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push('/');
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
