<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated color="primary">
      <q-toolbar>
        <q-toolbar-title> Appointment System </q-toolbar-title>
        <q-space />
        <q-btn
          v-if="isLoggedIn"
          flat
          dense
          icon="logout"
          label="Logout"
          no-caps
          @click="handleLogout"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = ref(false);

watchEffect(() => {
  isLoggedIn.value = !!localStorage.getItem('token');
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  isLoggedIn.value = false;
  void router.push('/');
};
</script>
