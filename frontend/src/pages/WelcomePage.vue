<template>
  <q-page class="welcome-page bg-slate-50 text-slate-800 q-py-xl q-px-md min-h-screen">
    <div class="container max-w-1100 margin-auto">
      <!-- HEADER / HERO -->
      <div class="text-center q-mb-xl">
        <div style="height: 20px;"></div>
        
        <q-chip color="primary" text-color="white" icon="auto_awesome" class="q-mb-sm text-weight-bold shadow-1">
          Multi-Category Appointment System
        </q-chip>
        <div style="height: 20px;"></div>
        <h1 class="text-h3 text-weight-bolder text-slate-900 q-my-xs">
          Smart Scheduling & Booking Platform
        </h1>
        <p class="text-subtitle1 text-slate-200 max-w-700 margin-auto font-normal">
          Easily schedule and manage appointments across Healthcare, Spa & Wellness, Education, Legal Advisory, and Professional Services.
        </p>

        <!-- Category Pills -->
        
      </div>

      <!-- ROLE CARDS GRID -->
      <div class="row q-col-gutter-lg q-mb-xl">
        <!-- Client Role Card -->
        <div class="col-12 col-md-4">
          <q-card elevated bordered class="role-card fill-height q-pa-md bg-white border-slate shadow-2">
            <q-card-section class="text-center">
              <q-avatar size="64px" color="blue-1" text-color="primary" icon="person" class="q-mb-md">
                <q-icon name="person" size="32px" />
              </q-avatar>
              <div class="text-h6 text-weight-bold text-slate-900" >Client Portal</div>
              <p class="text-body2 text-slate-600 q-mt-xs line-clamp">
                Explore services, select specialists, add diagnostic add-ons, and book convenient time slots.
              </p>
              
            </q-card-section>
          </q-card>
        </div>

        <!-- Provider Role Card -->
        <div class="col-12 col-md-4">
          <q-card elevated bordered class="role-card fill-height q-pa-md bg-white border-slate shadow-2">
            <q-card-section class="text-center">
              <q-avatar size="64px" color="teal-1" text-color="secondary" icon="badge" class="q-mb-md">
                <q-icon name="badge" size="32px" />
              </q-avatar>
              <div class="text-h6 text-weight-bold text-slate-900">Provider & Staff</div>
              <p class="text-body2 text-slate-600 q-mt-xs line-clamp">
                Access your consultation schedule, complete appointments, and manage break hours.
              </p>
              
            </q-card-section>
          </q-card>
        </div>

        <!-- Admin Role Card -->
        <div class="col-12 col-md-4">
          <q-card elevated bordered class="role-card fill-height q-pa-md bg-white border-slate shadow-2">
            <q-card-section class="text-center">
              <q-avatar size="64px" color="deep-orange-1" text-color="deep-orange" icon="admin_panel_settings" class="q-mb-md">
                <q-icon name="admin_panel_settings" size="32px" />
              </q-avatar>
              <div class="text-h6 text-weight-bold text-slate-900">Admin Control</div>
              <p class="text-body2 text-slate-600 q-mt-xs line-clamp">
                Configure categories, onboard providers, set base pricing, and monitor platform metrics.
              </p>
              
            </q-card-section>
          </q-card>
        </div>
      </div>
      <div class="row justify-center q-gutter-md q-mt-md">
        <q-btn
          to="/login?tab=login"
          color="primary"
          icon="login"
          label="Sign In"
          no-caps
          unelevated
          style="min-width: 160px; border-radius: 12px; height: 44px;"
          class="text-weight-bold shadow-1"
        />
        <q-btn
          to="/login?tab=register"
          outline
          color="primary"
          icon="person_add"
          label="Register as Client"
          no-caps
          style="min-width: 180px; border-radius: 12px; height: 44px;"
          class="text-weight-bold"
        />
      </div>
      
      <!-- FOOTER -->
      <div class="text-center text-caption text-slate-500 q-mt-lg">
        Multi-Category Appointment & Scheduling Platform © 2026
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
.max-w-1100 {
  max-width: 1100px;
}
.max-w-700 {
  max-width: 700px;
}
.margin-auto {
  margin-left: auto;
  margin-right: auto;
}
.border-slate {
  border: 1px solid #e2e8f0;
}
.role-card {
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.role-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
}
.rounded-btn {
  border-radius: 10px;
}
.fill-height {
  height: 100%;
}
.line-clamp {
  min-height: 40px;
}
</style>
