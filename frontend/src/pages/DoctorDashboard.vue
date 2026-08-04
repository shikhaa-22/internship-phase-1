<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-md shadow-1" style="border-radius: 12px">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold text-primary">Doctor Dashboard</div>
          <div class="text-subtitle2 text-grey-7">Welcome to your doctor dashboard</div>
        </div>
        <q-btn color="negative" flat icon="logout" label="Logout" no-caps @click="handleLogout" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  void router.push('/');
};
</script>
