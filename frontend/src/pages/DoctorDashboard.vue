<template>
  <q-page class="q-pa-md bg-slate-50 text-slate-800">
    <div class="max-width-container mx-auto">
      <!-- Header Banner -->
      <q-card
        elevated
        bordered
        class="q-pa-sm q-px-md q-mb-sm bg-white border-slate"
        style="border-radius: 10px"
      >
        <q-card-section class="row items-center justify-between q-pa-xs">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="44px" color="blue-7" text-color="white" icon="medical_services" />
            <div>
              <div class="row items-center q-gutter-xs">
                <span class="text-h6 text-weight-bold text-slate-900">{{ currentDoctorName }}</span>
                <q-chip color="blue-1" text-color="blue-8" size="sm" class="text-weight-bold">
                  Doctor Schedule
                </q-chip>
              </div>
              <div class="text-caption text-slate-600">
                Daily Roster & Medical Prescription Management
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-xs">
            <q-btn
              color="blue-7"
              
              dense
              class="q-px-sm"
              icon="refresh"
              label="Refresh"
              no-caps
              :loading="loading"
              @click="fetchAppointments"
            />
            <q-btn
              color="red-7"
              elevated
              dense
              class="q-px-sm"
              icon="logout"
              label="Logout"
              no-caps
              @click="handleLogout"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Date Selection & Stats Summary -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <!-- Prominent Calendar Card (50% Width) -->
        <div class="col-12 col-md-6">
          <q-card
            elevated
            bordered
            class="bg-white border-slate fill-height"
            style="border-radius: 10px"
          >
            <q-card-section class="q-pa-sm">
              <div class="row items-center justify-between q-mb-xs">
                <div class="text-subtitle1 text-weight-bold text-blue-9 row items-center">
                  <q-icon name="event" class="q-mr-xs" size="sm" />
                  Calendar Schedule
                </div>
                <div class="row q-gutter-xs">
                  <q-btn
                    size="sm"
                    elevated
                    no-caps
                    :color="selectedDate === todayDate ? 'blue-7' : 'slate-100'"
                    :text-color="selectedDate === todayDate ? 'white' : 'slate-700'"
                    label="Today"
                    class="q-px-sm"
                    @click="setDateTo(todayDate)"
                  />
                  <q-btn
                    size="sm"
                    elevated
                    no-caps
                    :color="selectedDate === tomorrowDate ? 'blue-7' : 'slate-100'"
                    :text-color="selectedDate === tomorrowDate ? 'white' : 'slate-700'"
                    label="Tomorrow"
                    class="q-px-sm"
                    @click="setDateTo(tomorrowDate)"
                  />
                </div>
              </div>

              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-input
                  v-model="selectedDate"
                  type="date"
                  outlined
                  dense
                  class="col"
                  @update:model-value="fetchAppointments"
                />
              </div>

              <div class="text-body2 text-center text-slate-700 bg-blue-50 q-pa-xs rounded-borders">
                Selected: <strong>{{ formattedSelectedDate }}</strong>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Metric Cards (50% Width) -->
        <div class="col-12 col-md-6">
          <div class="row q-col-gutter-xs fill-height">
            <div class="col-6 col-sm-3">
              <q-card
                elevated
                bordered
                class="bg-slate-50 border-slate fill-height column items-center justify-center q-pa-sm text-center"
                style="border-radius: 10px"
              >
                <div class="text-h4 text-weight-bold text-slate-800">
                  {{ totalSlotsCount }}
                </div>
                <div class="text-body2 text-slate-700 text-weight-bold q-mt-xs">Total Slots</div>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card
                elevated
                bordered
                class="bg-blue-50 border-blue-subtle fill-height column items-center justify-center q-pa-sm text-center"
                style="border-radius: 10px"
              >
                <div class="text-h4 text-weight-bold text-blue-9">
                  {{ occupiedSlotsCount }}
                </div>
                <div class="text-body2 text-blue-8 text-weight-bold q-mt-xs">Occupied</div>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card
                elevated
                bordered
                class="bg-green-50 border-emerald-subtle fill-height column items-center justify-center q-pa-sm text-center"
                style="border-radius: 10px"
              >
                <div class="text-h4 text-weight-bold text-green-9">
                  {{ completedSlotsCount }}
                </div>
                <div class="text-body2 text-green-8 text-weight-bold q-mt-xs">Completed</div>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card
                elevated
                bordered
                class="bg-amber-50 border-amber-subtle fill-height column items-center justify-center q-pa-sm text-center"
                style="border-radius: 10px"
              >
                <div class="text-h4 text-weight-bold text-amber-9">
                  {{ vacantSlotsCount }}
                </div>
                <div class="text-body2 text-amber-9 text-weight-bold q-mt-xs">Vacant</div>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Clean Separator & Gap between Calendar/Stats and Slots -->
      <q-separator class="q-my-lg" />

      <!-- Schedule Slots Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-icon name="schedule" color="blue-7" class="q-mr-xs" size="sm" />
          <span class="text-subtitle1 text-weight-bold text-slate-900">
            Daily Roster — {{ formattedSelectedDate }}
          </span>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-badge color="blue-7" label="Confirmed" size="sm" class="q-px-xs" />
          <q-badge color="green-8" label="Completed" size="sm" class="q-px-xs" />
          <q-badge color="amber-8" label="Break" size="sm" class="q-px-xs" />
          <q-badge color="red-6" label="Cancelled" size="sm" class="q-px-xs" />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="row justify-center q-py-md">
        <q-spinner-dots color="blue-7" size="36px" />
      </div>

      <!-- Slots Grid (Clear Readable Text) -->
      <div v-else class="column q-gutter-y-sm">
        <div v-for="slot in computedTimeSlots" :key="slot.slotTime" class="slot-card-wrapper">
          <!-- OCCUPIED SLOT (Confirmed) -->
          <q-card
            v-if="slot.appointment && slot.appointment.status === 'confirmed'"
            elevated
            bordered
            class="slot-card occupied-card bg-white"
          >
            <q-card-section
              class="row items-center justify-between q-col-gutter-xs q-pa-sm q-px-md"
            >
              <!-- Left: Time & Status -->
              <div class="col-12 col-sm-3 row items-center q-gutter-xs">
                <q-chip
                  color="blue-7"
                  text-color="white"
                  icon="access_time"
                  class="text-weight-bold"
                  dense
                  size="sm"
                  style="font-size: 13px"
                >
                  {{ slot.slotTime }}
                </q-chip>
                <q-chip color="blue-1" text-color="blue-9" size="sm" dense class="text-weight-bold">
                  CONFIRMED
                </q-chip>
              </div>

              <!-- Middle: Patient Details & Medical History Trigger -->
              <div class="col-12 col-sm-5">
                <div class="row items-center q-gutter-xs">
                  <q-icon name="person" color="blue-7" size="sm" />
                  <span
                    class="text-subtitle2 text-weight-bold text-blue-9 cursor-pointer hover-underline"
                    @click="
                      openPatientHistory(
                        slot.appointment.client_id,
                        slot.appointment.client_name,
                        slot.appointment.client_email,
                      )
                    "
                  >
                    {{ slot.appointment.client_name }}
                  </span>
                  <q-btn
                    elevated
                    round
                    dense
                    size="sm"
                    color="blue-7"
                    icon="history"
                    @click="
                      openPatientHistory(
                        slot.appointment.client_id,
                        slot.appointment.client_name,
                        slot.appointment.client_email,
                      )
                    "
                  >
                    <q-tooltip>Patient History</q-tooltip>
                  </q-btn>
                </div>
                <div class="text-body2 text-slate-700 row items-center q-gutter-x-sm">
                  <span>{{ slot.appointment.service_title }}</span>
                  <span class="text-weight-bold text-slate-900"
                    >${{ Number(slot.appointment.total_amount).toFixed(2) }}</span
                  >
                  <span
                    v-if="slot.appointment.add_ons_summary"
                    class="text-blue-9 text-weight-medium"
                  >
                    ({{ slot.appointment.add_ons_summary }})
                  </span>
                </div>
              </div>

              <!-- Right: Actions -->
              <div class="col-12 col-sm-4 row justify-end q-gutter-xs">
                <q-btn
                  color="positive"
                  elevated
                  size="sm"
                  class="q-px-sm text-weight-bold"
                  icon="medication"
                  label="Prescribe / Complete"
                  no-caps
                  @click="openCompleteDialog(slot.appointment)"
                />
                <q-btn
                  color="blue-7"
                  outline
                  size="sm"
                  class="q-px-sm text-weight-bold"
                  icon="add_circle"
                  label="Add Test"
                  no-caps
                  @click="openAddOnDialog(slot.appointment)"
                />
                <q-btn
                  color="red-6"
                  elevated
                  size="sm"
                  class="q-px-sm text-weight-bold"
                  icon="cancel"
                  label="Cancel"
                  no-caps
                  @click="openCancelDialog(slot.appointment)"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- COMPLETED CONSULTATION SLOT -->
          <q-card
            v-else-if="slot.appointment && slot.appointment.status === 'completed'"
            elevated
            bordered
            class="slot-card completed-card bg-white"
          >
            <q-card-section class="column q-gutter-xs q-pa-sm q-px-md">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-xs">
                  <q-chip
                    color="positive"
                    text-color="white"
                    icon="access_time"
                    class="text-weight-bold"
                    dense
                    size="sm"
                    style="font-size: 13px"
                  >
                    {{ slot.slotTime }}
                  </q-chip>
                  <q-chip
                    color="green-2"
                    text-color="green-10"
                    size="sm"
                    dense
                    icon="check_circle"
                    class="text-weight-bold"
                  >
                    COMPLETED
                  </q-chip>
                </div>
                <div class="text-body2 text-grey-8">
                  Patient:
                  <span
                    class="text-weight-bold text-primary cursor-pointer hover-underline"
                    @click="
                      openPatientHistory(
                        slot.appointment.client_id,
                        slot.appointment.client_name,
                        slot.appointment.client_email,
                      )
                    "
                  >
                    {{ slot.appointment.client_name }}
                  </span>
                  ({{ slot.appointment.service_title }})
                </div>
              </div>

              <!-- Clinical Notes & Prescription Banner -->
              <div class="row items-center justify-between">
                <div
                  class="bg-green-1 text-grey-9 q-pa-sm border-green-soft rounded-borders text-body2 col"
                >
                  <div>
                    <span class="text-weight-bold text-green-9">📋 Diagnosis & Notes: </span>
                    <span>"{{ slot.appointment.clinical_notes || 'Consultation completed' }}"</span>
                  </div>
                  <div class="q-mt-xs">
                    <span class="text-weight-bold text-green-9"
                      >💊 Prescription & Medications:
                    </span>
                    <span class="text-weight-medium">{{
                      slot.appointment.prescription || 'No prescription issued'
                    }}</span>
                  </div>
                </div>

                <q-btn
                  color="positive"
                  outline
                  size="sm"
                  class="q-px-sm q-ml-md text-weight-bold"
                  icon="edit_note"
                  label="Edit Prescription"
                  no-caps
                  @click="openCompleteDialog(slot.appointment)"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- BLOCKED BREAK SLOT -->
          <q-card
            v-else-if="slot.appointment && slot.appointment.status === 'blocked'"
            elevated
            bordered
            class="slot-card blocked-card bg-white"
          >
            <q-card-section class="row items-center justify-between q-pa-sm q-px-md">
              <div class="row items-center q-gutter-sm">
                <q-chip
                  color="amber-8"
                  text-color="white"
                  icon="free_breakfast"
                  class="text-weight-bold"
                  dense
                  size="sm"
                  style="font-size: 13px"
                >
                  {{ slot.slotTime }}
                </q-chip>
                <div>
                  <span class="text-subtitle2 text-weight-bold text-amber-9">
                    Doctor Break / Off-Duty
                  </span>
                  <span class="text-body2 text-slate-700 q-ml-xs">
                    ("{{ slot.appointment.cancellation_reason || 'Lunch Break' }}")
                  </span>
                </div>
              </div>

              <q-btn
                color="amber-9"
                outline
                size="sm"
                class="q-px-sm text-weight-bold"
                icon="lock_open"
                label="Unblock Slot"
                no-caps
                @click="unblockSlot(slot.appointment.id)"
              />
            </q-card-section>
          </q-card>

          <!-- OCCUPIED SLOT (Cancelled) -->
          <q-card
            v-else-if="slot.appointment && slot.appointment.status === 'cancelled'"
            elevated
            bordered
            class="slot-card cancelled-card bg-white"
          >
            <q-card-section class="column q-gutter-xs q-pa-sm q-px-md">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-xs">
                  <q-chip
                    color="slate-600"
                    text-color="white"
                    icon="access_time"
                    class="text-weight-bold"
                    dense
                    size="sm"
                    style="font-size: 13px"
                  >
                    {{ slot.slotTime }}
                  </q-chip>
                  <q-chip
                    color="red-1"
                    text-color="red-7"
                    size="sm"
                    dense
                    icon="cancel"
                    class="text-weight-bold"
                  >
                    CANCELLED
                  </q-chip>
                </div>
                <div class="text-body2 text-slate-700">
                  Patient: <strong>{{ slot.appointment.client_name }}</strong> ({{
                    slot.appointment.service_title
                  }})
                </div>
              </div>

              <div class="bg-red-50 text-red-8 q-pa-sm border-red-soft rounded-borders text-body2">
                <span class="text-weight-bold">Reason for Cancellation: </span>
                <span>"{{ slot.appointment.cancellation_reason || 'Cancelled by doctor' }}"</span>
              </div>
            </q-card-section>
          </q-card>

          <!-- VACANT SLOT -->
          <q-card v-else elevated bordered class="slot-card vacant-card bg-white">
            <q-card-section class="row items-center justify-between q-pa-sm q-px-md">
              <div class="row items-center q-gutter-sm">
                <q-chip
                  color="slate-500"
                  outline
                  icon="access_time"
                  class="text-weight-bold bg-white"
                  dense
                  size="sm"
                  style="font-size: 13px"
                >
                  {{ slot.slotTime }}
                </q-chip>
                <span class="text-subtitle2 text-slate-700"
                  >Vacant Slot (Available for Booking)</span
                >
              </div>

              <div class="row items-center q-gutter-xs">
                <q-chip
                  color="amber-9"
                  text-color="white"
                  size="sm"
                  icon="check_circle"
                  elevated
                >
                  Open
                </q-chip>
                <q-btn
                  color="amber-9"
                  outline
                  size="sm"
                  class="q-px-sm text-weight-bold"
                  icon="block"
                  label="Mark Break"
                  no-caps
                  @click="openBlockDialog(slot.hour)"
                />
                
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- FEATURE 1: COMPLETE CONSULTATION & CLINICAL NOTES DIALOG -->
    <q-dialog v-model="completeModalOpen" persistent>
      <q-card style="min-width: 460px; border-radius: 12px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-positive">
          <div class="text-subtitle1 text-weight-bold row items-center">
            <q-icon name="medication" class="q-mr-xs" size="sm" />
            Add Prescription & Consultation Notes
          </div>
          <q-btn icon="close" elevated round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="targetAppointment" class="q-pt-none">
          <div class="q-mb-md bg-green-1 q-pa-sm text-body2 rounded-borders text-grey-9">
            <div><strong>Patient:</strong> {{ targetAppointment.client_name }}</div>
            <div><strong>Service:</strong> {{ targetAppointment.service_title }}</div>
            <div><strong>Time:</strong> {{ formatTime(targetAppointment.start_time) }}</div>
          </div>

          <q-form @submit.prevent="confirmCompletion">
            <q-input
              v-model="prescriptionInput"
              type="textarea"
              outlined
              dense
              label="Prescription & Medications Summary *"
              hint="List prescribed medicines, dosage, or instructions"
              rows="3"
              class="q-mb-sm"
              autofocus
            />

            <q-input
              v-model="clinicalNotesInput"
              type="textarea"
              outlined
              dense
              label="Diagnosis & Clinical Notes"
              hint="Enter observations or diagnosis summary"
              rows="2"
              class="q-mb-md"
            />

            <div class="row justify-end q-gutter-xs">
              <q-btn label="Cancel" elevated no-caps dense v-close-popup />
              <q-btn
                label="Save Prescription & Notes"
                color="positive"
                type="submit"
                elevated
                no-caps
                dense
                class="q-px-sm"
                :loading="submittingComplete"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- FEATURE 2: BLOCK BREAK SLOT DIALOG -->
    <q-dialog v-model="blockModalOpen" persistent>
      <q-card style="min-width: 400px; border-radius: 12px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-amber-9">
          <div class="text-subtitle1 text-weight-bold row items-center">
            <q-icon name="block" class="q-mr-xs" size="sm" />
            Mark Time Slot as Unavailable
          </div>
          <q-btn icon="close" elevated round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-mb-md bg-amber-50 q-pa-sm text-body2 rounded-borders text-slate-800">
            <div><strong>Selected Time Slot:</strong> {{ targetBlockHourLabel }}</div>
            <div><strong>Date:</strong> {{ formattedSelectedDate }}</div>
          </div>

          <q-form @submit.prevent="confirmBlockSlot">
            <q-input
              v-model="blockReasonInput"
              outlined
              dense
              label="Reason for Break / Off-Duty *"
              hint="e.g. Lunch Break, Ward Rounds, Off-Duty"
              class="q-mb-md"
              autofocus
              :rules="[(val) => (val && val.trim().length > 0) || 'Reason is required']"
            />

            <div class="row justify-end q-gutter-xs">
              <q-btn label="Cancel" elevated no-caps dense v-close-popup />
              <q-btn
                label="Confirm Block"
                color="amber-8"
                type="submit"
                elevated
                no-caps
                dense
                class="q-px-sm"
                :loading="submittingBlock"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- FEATURE 3: PATIENT MEDICAL HISTORY DIALOG -->
    <q-dialog v-model="historyModalOpen">
      <q-card style="min-width: 500px; max-width: 650px; border-radius: 12px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-blue-8">
          <div class="row items-center q-gutter-sm">
            <q-avatar color="blue-7" text-color="white" icon="history" size="36px" />
            <div>
              <div class="text-subtitle1 text-weight-bold text-slate-900">
                {{ patientHistoryName }}
              </div>
              <div class="text-body2 text-slate-600">{{ patientHistoryEmail }}</div>
            </div>
          </div>
          <q-btn icon="close" elevated round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 400px" class="scroll">
          <div v-if="loadingHistory" class="row justify-center q-py-md">
            <q-spinner-dots color="blue-7" size="30px" />
          </div>

          <div
            v-else-if="patientHistoryList.length === 0"
            class="text-center text-slate-500 q-py-md text-body2"
          >
            No previous consultation records found for this patient.
          </div>

          <div v-else class="column q-gutter-sm">
            <q-card
              v-for="item in patientHistoryList"
              :key="item.id"
              elevated
              bordered
              class="bg-slate-50 border-slate"
              style="border-radius: 8px"
            >
              <q-card-section class="q-pa-sm column q-gutter-xs">
                <div class="row items-center justify-between">
                  <span class="text-weight-bold text-blue-8 text-body2">
                    {{ formatDateShort(item.start_time) }} - {{ item.service_title }}
                  </span>
                  <q-chip
                    :color="getStatusColor(item.status)"
                    text-color="white"
                    size="sm"
                    dense
                    class="text-weight-bold"
                  >
                    {{ item.status.toUpperCase() }}
                  </q-chip>
                </div>

                <div class="text-body2 text-slate-700">
                  Provider: <strong>{{ item.doctor_name }}</strong>
                </div>

                <div v-if="item.add_ons_summary" class="text-body2 text-blue-9">
                  Tests/Add-Ons: {{ item.add_ons_summary }}
                </div>

                <div
                  v-if="item.clinical_notes"
                  class="bg-white q-pa-xs rounded-borders text-body2 text-slate-800"
                >
                  <strong>Diagnosis:</strong> "{{ item.clinical_notes }}"
                </div>

                <div
                  v-if="item.prescription"
                  class="bg-white q-pa-xs rounded-borders text-body2 text-slate-800"
                >
                  <strong>Prescription:</strong> {{ item.prescription }}
                </div>

                <div
                  v-if="item.status === 'cancelled' && item.cancellation_reason"
                  class="text-body2 text-red-7"
                >
                  <strong>Cancelled:</strong> "{{ item.cancellation_reason }}"
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- RECOMMEND ADD-ON DIALOG -->
    <q-dialog v-model="addOnModalOpen" persistent>
      <q-card style="min-width: 440px; border-radius: 12px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-blue-8">
          <div class="text-subtitle1 text-weight-bold row items-center">
            <q-icon name="medical_services" class="q-mr-xs" size="sm" />
            Add Recommended Test / Service
          </div>
          <q-btn icon="close" elevated round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="targetAppointment" class="q-pt-none">
          <div class="q-mb-md bg-blue-50 q-pa-sm text-body2 rounded-borders text-slate-800">
            <div><strong>Patient:</strong> {{ targetAppointment.client_name }}</div>
            <div><strong>Service:</strong> {{ targetAppointment.service_title }}</div>
            <div>
              <strong>Current Total:</strong> ${{
                Number(targetAppointment.total_amount).toFixed(2)
              }}
            </div>
            <div v-if="unattachedSelectedCount > 0" class="text-weight-bold text-blue-8 q-mt-xs">
              Estimated New Total: ${{ estimatedNewTotal.toFixed(2) }}
            </div>
          </div>

          <div class="text-body2 text-weight-bold q-mb-xs">Select Add-On Diagnostic Tests:</div>

          <div v-if="loadingAddOns" class="row justify-center q-py-md">
            <q-spinner-dots color="blue-7" size="28px" />
          </div>

          <q-form v-else @submit.prevent="submitAddOns">
            <div class="column q-gutter-xs q-mb-md">
              <div
                v-for="addon in availableAddOns"
                :key="addon.id"
                class="q-pa-xs border-slate rounded-borders row items-center justify-between bg-slate-50"
              >
                <!-- Already attached state -->
                <div
                  v-if="isAddOnAttached(addon.id)"
                  class="row items-center justify-between full-width"
                >
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="check_circle" color="positive" size="sm" />
                    <div>
                      <div class="text-weight-bold text-body2 text-slate-800">
                        {{ addon.title }}
                      </div>
                      <div class="text-caption text-slate-600">
                        {{ addon.description }}
                      </div>
                    </div>
                  </div>
                  <q-chip
                    color="positive"
                    text-color="white"
                    size="sm"
                    dense
                    class="text-weight-bold"
                  >
                    Attached (+${{ Number(addon.price).toFixed(2) }})
                  </q-chip>
                </div>

                <!-- Selectable unattached state -->
                <template v-else>
                  <q-checkbox v-model="selectedAddOnIds" :val="addon.id" color="blue-7">
                    <template #default>
                      <div>
                        <div class="text-weight-bold text-body2 text-slate-900">
                          {{ addon.title }}
                        </div>
                        <div class="text-caption text-slate-600">
                          {{ addon.description }}
                        </div>
                      </div>
                    </template>
                  </q-checkbox>
                  <span class="text-weight-bold text-blue-7 text-body2 q-ml-sm"
                    >+${{ Number(addon.price).toFixed(2) }}</span
                  >
                </template>
              </div>
            </div>

            <div class="row justify-end q-gutter-xs">
              <q-btn label="Cancel" elevated no-caps dense v-close-popup />
              <q-btn
                label="Attach Selected Services"
                color="blue-7"
                type="submit"
                elevated
                no-caps
                dense
                class="q-px-sm"
                :disabled="unattachedSelectedCount === 0"
                :loading="submittingAddOns"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- CANCELLATION DIALOG -->
    <q-dialog v-model="cancelModalOpen" persistent>
      <q-card style="min-width: 400px; border-radius: 12px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-red-7">
          <div class="text-subtitle1 text-weight-bold row items-center">
            <q-icon name="warning" class="q-mr-xs" size="sm" />
            Cancel Appointment
          </div>
          <q-btn icon="close" elevated round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="targetAppointment" class="q-pt-none">
          <div class="q-mb-md bg-slate-100 q-pa-sm text-body2 rounded-borders">
            <div><strong>Patient:</strong> {{ targetAppointment.client_name }}</div>
            <div><strong>Service:</strong> {{ targetAppointment.service_title }}</div>
            <div><strong>Time:</strong> {{ formatTime(targetAppointment.start_time) }}</div>
          </div>

          <q-form @submit.prevent="confirmCancellation">
            <q-input
              v-model="cancelReasonInput"
              type="textarea"
              outlined
              dense
              label="Reason for Cancellation *"
              hint="Please explain why this appointment is being cancelled"
              rows="3"
              autofocus
              :rules="[
                (val) => (val && val.trim().length > 0) || 'Cancellation reason is required',
              ]"
            />

            <div class="row justify-end q-gutter-xs q-mt-md">
              <q-btn label="Dismiss" elevated no-caps dense v-close-popup />
              <q-btn
                label="Confirm Cancellation"
                color="red-7"
                type="submit"
                elevated
                no-caps
                dense
                class="q-px-sm"
                :loading="submittingCancel"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { appointmentService } from '../services/appointmentService';

interface Appointment {
  id: number;
  client_id: number;
  doctor_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'blocked';
  cancellation_reason?: string | null;
  clinical_notes?: string | null;
  prescription?: string | null;
  total_amount: number | string;
  client_name: string;
  client_email?: string;
  service_title: string;
  add_ons_summary?: string | null;
  attached_add_on_ids?: string | null;
}

interface AddOnOption {
  id: number;
  title: string;
  description: string;
  price: number | string;
  duration_minutes: number;
}

interface SlotItem {
  slotTime: string;
  hour: number;
  appointment?: Appointment | undefined;
}

interface PatientHistoryItem {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  clinical_notes?: string | null;
  prescription?: string | null;
  cancellation_reason?: string | null;
  total_amount: number | string;
  doctor_name: string;
  service_title: string;
  add_ons_summary?: string | null;
}

const router = useRouter();

// State
const loading = ref(false);
const submittingCancel = ref(false);
const appointments = ref<Appointment[]>([]);

// Feature 1: Complete Consultation State
const completeModalOpen = ref(false);
const submittingComplete = ref(false);
const clinicalNotesInput = ref('');
const prescriptionInput = ref('');

// Feature 2: Block Break Slot State
const blockModalOpen = ref(false);
const submittingBlock = ref(false);
const targetBlockHour = ref<number>(9);
const blockReasonInput = ref('Lunch Break');

// Feature 3: Patient History State
const historyModalOpen = ref(false);
const loadingHistory = ref(false);
const patientHistoryName = ref('');
const patientHistoryEmail = ref('');
const patientHistoryList = ref<PatientHistoryItem[]>([]);

// Add-On Recommendation State
const addOnModalOpen = ref(false);
const loadingAddOns = ref(false);
const submittingAddOns = ref(false);
const availableAddOns = ref<AddOnOption[]>([]);
const selectedAddOnIds = ref<number[]>([]);

// User / Doctor State
const currentDoctorId = ref<number>(2);
const currentDoctorName = ref<string>('Dr. Robert Smith');

// Date state (Format: YYYY-MM-DD)
const todayStr = new Date().toISOString().slice(0, 10);
const selectedDate = ref<string>(todayStr);

// Modal state
const cancelModalOpen = ref(false);
const targetAppointment = ref<Appointment | null>(null);
const cancelReasonInput = ref('');

// Computed Dates
const todayDate = computed(() => new Date().toISOString().slice(0, 10));
const tomorrowDate = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
});

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return '';
  const parts = selectedDate.value.split('-');
  if (parts.length !== 3) return selectedDate.value;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

// Standard time slots (09:00 AM to 05:00 PM)
const standardHours = [9, 10, 11, 12, 13, 14, 15, 16];

function formatHourLabel(h: number): string {
  const startAmPm = h >= 12 ? 'PM' : 'AM';
  const start12 = h % 12 === 0 ? 12 : h % 12;
  const endH = h + 1;
  const endAmPm = endH >= 12 ? 'PM' : 'AM';
  const end12 = endH % 12 === 0 ? 12 : endH % 12;

  const startStr = `${start12.toString().padStart(2, '0')}:00 ${startAmPm}`;
  const endStr = `${end12.toString().padStart(2, '0')}:00 ${endAmPm}`;
  return `${startStr} - ${endStr}`;
}

const targetBlockHourLabel = computed(() => {
  return formatHourLabel(targetBlockHour.value);
});

function formatTime(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const hourPart = parseInt(dateTimeStr.slice(11, 13), 10);
  const minutePart = dateTimeStr.slice(14, 16);
  const ampm = hourPart >= 12 ? 'PM' : 'AM';
  const hour12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
  return `${hour12.toString().padStart(2, '0')}:${minutePart} ${ampm}`;
}

function formatDateShort(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const datePart = dateTimeStr.slice(0, 10);
  const timePart = formatTime(dateTimeStr);
  return `${datePart} ${timePart}`;
}

function getStatusColor(status: string): string {
  if (status === 'completed') return 'positive';
  if (status === 'confirmed') return 'blue-7';
  if (status === 'cancelled') return 'red-6';
  if (status === 'blocked') return 'amber-8';
  return 'slate-500';
}

// Check if an add-on is already attached to current target appointment
const isAddOnAttached = (addonId: number): boolean => {
  if (!targetAppointment.value || !targetAppointment.value.attached_add_on_ids) return false;
  const attachedList = targetAppointment.value.attached_add_on_ids
    .split(',')
    .map((s) => Number(s.trim()));
  return attachedList.includes(addonId);
};

// Count of newly selected unattached add-ons
const unattachedSelectedCount = computed(() => {
  return selectedAddOnIds.value.filter((id) => !isAddOnAttached(id)).length;
});

// Live updating price calculation preview
const estimatedNewTotal = computed(() => {
  if (!targetAppointment.value) return 0;
  const currentTotal = Number(targetAppointment.value.total_amount) || 0;
  const unattachedSum = selectedAddOnIds.value.reduce((sum, id) => {
    if (isAddOnAttached(id)) return sum;
    const item = availableAddOns.value.find((a) => a.id === id);
    return sum + (item ? Number(item.price) : 0);
  }, 0);

  return currentTotal + unattachedSum * 1.1;
});

// Compute slots merged with appointments
const computedTimeSlots = computed<SlotItem[]>(() => {
  return standardHours.map((hour) => {
    const slotTime = formatHourLabel(hour);

    const matchedAppt = appointments.value.find((a) => {
      if (!a.start_time) return false;
      const apptDate = a.start_time.slice(0, 10);
      const apptHour = parseInt(a.start_time.slice(11, 13), 10);

      return apptDate === selectedDate.value && apptHour === hour;
    });

    return {
      slotTime,
      hour,
      appointment: matchedAppt,
    };
  });
});

// Statistics
const totalSlotsCount = computed(() => standardHours.length);
const occupiedSlotsCount = computed(() => {
  return computedTimeSlots.value.filter(
    (s) => s.appointment && s.appointment.status === 'confirmed',
  ).length;
});
const completedSlotsCount = computed(() => {
  return computedTimeSlots.value.filter(
    (s) => s.appointment && s.appointment.status === 'completed',
  ).length;
});
const vacantSlotsCount = computed(() => {
  return computedTimeSlots.value.filter((s) => !s.appointment).length;
});

// Set date helper
const setDateTo = (dStr: string) => {
  selectedDate.value = dStr;
  void fetchAppointments();
};

// Fetch appointments strictly for logged in doctor from database
const fetchAppointments = async () => {
  loading.value = true;
  try {
    appointments.value = await appointmentService.getDoctorAppointments(currentDoctorId.value);
  } catch (err) {
    console.error('API fetch failed:', err);
    appointments.value = [];
  } finally {
    loading.value = false;
  }
};

// FEATURE 1: COMPLETE CONSULTATION & CLINICAL NOTES
const openCompleteDialog = (appt: Appointment) => {
  targetAppointment.value = appt;
  clinicalNotesInput.value = appt.clinical_notes || '';
  prescriptionInput.value = appt.prescription || '';
  completeModalOpen.value = true;
};

const confirmCompletion = async () => {
  if (!targetAppointment.value) return;

  const notesText = clinicalNotesInput.value.trim() || 'Consultation completed';
  const rxText = prescriptionInput.value.trim();

  submittingComplete.value = true;
  try {
    await appointmentService.completeConsultation({
      appointmentId: targetAppointment.value.id,
      clinicalNotes: notesText,
      prescription: rxText,
    });

    if (targetAppointment.value) {
      targetAppointment.value.status = 'completed';
      targetAppointment.value.clinical_notes = notesText;
      targetAppointment.value.prescription = rxText;
    }
    await fetchAppointments();
  } catch (err) {
    console.error('Failed to complete consultation:', err);
  } finally {
    submittingComplete.value = false;
    completeModalOpen.value = false;
  }
};

// FEATURE 2: BLOCK BREAK SLOT DIALOG
const openBlockDialog = (hour: number) => {
  targetBlockHour.value = hour;
  blockReasonInput.value = 'Lunch Break';
  blockModalOpen.value = true;
};

const confirmBlockSlot = async () => {
  if (!blockReasonInput.value.trim()) return;

  submittingBlock.value = true;
  try {
    const hourStr = targetBlockHour.value.toString().padStart(2, '0');
    const startTimeStr = `${selectedDate.value} ${hourStr}:00:00`;

    await appointmentService.blockSlot({
      doctorId: currentDoctorId.value,
      startTime: startTimeStr,
      breakReason: blockReasonInput.value.trim(),
    });

    await fetchAppointments();
  } catch (err) {
    console.error('Failed to block slot:', err);
  } finally {
    submittingBlock.value = false;
    blockModalOpen.value = false;
  }
};

const unblockSlot = async (appointmentId: number) => {
  try {
    await appointmentService.unblockSlot(appointmentId);
    await fetchAppointments();
  } catch (err) {
    console.error('Failed to unblock slot:', err);
  }
};

// FEATURE 3: PATIENT MEDICAL HISTORY QUICK VIEW
const openPatientHistory = async (clientId: number, clientName: string, clientEmail?: string) => {
  patientHistoryName.value = clientName;
  patientHistoryEmail.value = clientEmail || '';
  patientHistoryList.value = [];
  historyModalOpen.value = true;
  loadingHistory.value = true;

  try {
    patientHistoryList.value = await appointmentService.getPatientHistory(clientId);
  } catch (err) {
    console.error('Failed to fetch patient history:', err);
  } finally {
    loadingHistory.value = false;
  }
};

// Fetch available add-on services from API
const fetchAvailableAddOns = async () => {
  loadingAddOns.value = true;
  try {
    availableAddOns.value = await appointmentService.getAvailableAddOns();
  } catch (err) {
    console.error('Failed to fetch add-ons:', err);
  } finally {
    loadingAddOns.value = false;
  }
};

// Open Add-On Modal
const openAddOnDialog = (appt: Appointment) => {
  targetAppointment.value = appt;
  selectedAddOnIds.value = [];
  addOnModalOpen.value = true;
  void fetchAvailableAddOns();
};

// Submit Add-Ons attachment
const submitAddOns = async () => {
  if (!targetAppointment.value) return;

  const newlySelectedIds = selectedAddOnIds.value.filter((id) => !isAddOnAttached(id));
  if (newlySelectedIds.length === 0) return;

  submittingAddOns.value = true;
  try {
    const result = await appointmentService.attachAddOns({
      appointmentId: targetAppointment.value.id,
      addOnIds: newlySelectedIds,
    });

    if (result.pricing && targetAppointment.value) {
      targetAppointment.value.total_amount = result.pricing.totalAmount;
    }
  } catch (err) {
    console.error('Failed to attach add-ons:', err);
  } finally {
    submittingAddOns.value = false;
    addOnModalOpen.value = false;
    await fetchAppointments();
  }
};

// Cancellation Modal Handlers
const openCancelDialog = (appt: Appointment) => {
  targetAppointment.value = appt;
  cancelReasonInput.value = '';
  cancelModalOpen.value = true;
};

const confirmCancellation = async () => {
  if (!targetAppointment.value || !cancelReasonInput.value.trim()) return;

  const reasonText = cancelReasonInput.value.trim();
  const targetId = targetAppointment.value.id;

  submittingCancel.value = true;

  if (targetAppointment.value) {
    targetAppointment.value.status = 'cancelled';
    targetAppointment.value.cancellation_reason = reasonText;
  }

  const itemInList = appointments.value.find((a) => a.id === targetId);
  if (itemInList) {
    itemInList.status = 'cancelled';
    itemInList.cancellation_reason = reasonText;
  }

  try {
    await appointmentService.cancelAppointment({
      appointmentId: targetId,
      cancellationReason: reasonText,
    });

    await fetchAppointments();
  } catch (err) {
    console.warn('Backend update error, kept local reason state:', err);
  } finally {
    submittingCancel.value = false;
    cancelModalOpen.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  void router.push('/');
};

onMounted(() => {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.id) {
        currentDoctorId.value = user.id;
      }
      if (user.name) {
        currentDoctorName.value = user.name;
      }
    } catch {
      // Ignore parse error
    }
  }
  void fetchAppointments();
});
</script>

<style scoped>
.max-width-container {
  max-width: 100%;
  width: 100%;
}

.fill-height {
  height: 100%;
}

.slot-card {
  border-radius: 6px;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: border-color 0.15s ease;
}

.border-slate {
  border: 1px solid #e2e8f0;
}

.border-blue-subtle {
  border: 1px solid #bfdbfe;
}

.border-emerald-subtle {
  border: 1px solid #a7f3d0;
}

.slot-card-wrapper {
  margin-bottom: 8px;
}

.border-amber-subtle {
  border: 1px solid #fde68a;
}

.occupied-card {
  border-left: 4px solid #2563eb;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.completed-card {
  border-left: 4px solid #16a34a;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.blocked-card {
  border-left: 4px solid #d97706;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.cancelled-card {
  border-left: 4px solid #dc2626;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.vacant-card {
  border: 1px dashed #cbd5e1;
}

.border-green-soft {
  border-left: 4px solid #16a34a;
  border-top: 1px solid #bbf7d0;
  border-right: 1px solid #bbf7d0;
  border-bottom: 1px solid #bbf7d0;
}

.border-red-soft {
  border-left: 3px solid #dc2626;
}

.hover-underline:hover {
  text-decoration: underline;
}
</style>
