<template>
  <q-page class="q-pa-md bg-grey-1 text-grey-9">
    <div class="max-width-container mx-auto">
      <!-- Header Banner -->
      <q-card flat bordered class="q-pa-md q-mb-lg shadow-1 bg-white" style="border-radius: 16px">
        <q-card-section class="row items-center justify-between q-col-gutter-md">
          <div class="row items-center q-gutter-md">
            <q-avatar size="56px" color="primary" text-color="white" icon="medical_services" />
            <div>
              <div class="row items-center q-gutter-sm">
                <span class="text-h5 text-weight-bold text-grey-9">{{ currentDoctorName }}</span>
                <q-chip color="primary" text-color="white" size="sm" dense icon="verified">
                  Doctor
                </q-chip>
              </div>
              <div class="text-subtitle2 text-grey-6">
                Manage appointment slots, patient clinical notes, break schedules, and medical
                history
              </div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-btn
              color="primary"
              outline
              icon="refresh"
              label="Refresh"
              no-caps
              :loading="loading"
              @click="fetchAppointments"
            />
            <q-btn
              color="negative"
              flat
              icon="logout"
              label="Logout"
              no-caps
              @click="handleLogout"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Date Selection & Stats Summary -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Date Selector Card -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="shadow-1 bg-white fill-height" style="border-radius: 16px">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold q-mb-xs text-primary row items-center">
                <q-icon name="event" class="q-mr-sm" size="sm" />
                Select Schedule Date
              </div>
              <div class="text-caption text-grey-7 q-mb-md">
                Viewing schedule for <strong>{{ formattedSelectedDate }}</strong>
              </div>

              <q-input
                v-model="selectedDate"
                type="date"
                outlined
                dense
                class="q-mb-sm"
                @update:model-value="fetchAppointments"
              />

              <div class="row q-gutter-xs">
                <q-btn
                  size="sm"
                  unelevated
                  no-caps
                  :color="selectedDate === todayDate ? 'primary' : 'grey-3'"
                  :text-color="selectedDate === todayDate ? 'white' : 'grey-9'"
                  label="Today"
                  @click="setDateTo(todayDate)"
                />
                <q-btn
                  size="sm"
                  unelevated
                  no-caps
                  :color="selectedDate === tomorrowDate ? 'primary' : 'grey-3'"
                  :text-color="selectedDate === tomorrowDate ? 'white' : 'grey-9'"
                  label="Tomorrow"
                  @click="setDateTo(tomorrowDate)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Metric Cards -->
        <div class="col-12 col-md-8">
          <div class="row q-col-gutter-sm">
            <div class="col-6 col-sm-3">
              <q-card
                flat
                bordered
                class="bg-blue-1 text-primary text-center q-pa-sm shadow-1"
                style="border-radius: 14px"
              >
                <div class="text-h4 text-weight-bolder">{{ totalSlotsCount }}</div>
                <div class="text-caption text-weight-medium">Total Slots</div>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card
                flat
                bordered
                class="bg-indigo-1 text-indigo-9 text-center q-pa-sm shadow-1"
                style="border-radius: 14px"
              >
                <div class="text-h4 text-weight-bolder">{{ occupiedSlotsCount }}</div>
                <div class="text-caption text-weight-medium">Occupied</div>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card
                flat
                bordered
                class="bg-green-1 text-positive text-center q-pa-sm shadow-1"
                style="border-radius: 14px"
              >
                <div class="text-h4 text-weight-bolder">{{ vacantSlotsCount }}</div>
                <div class="text-caption text-weight-medium">Vacant</div>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card
                flat
                bordered
                class="bg-purple-1 text-purple-9 text-center q-pa-sm shadow-1"
                style="border-radius: 14px"
              >
                <div class="text-h4 text-weight-bolder">{{ completedSlotsCount }}</div>
                <div class="text-caption text-weight-medium">Completed</div>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Slots Header -->
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h6 text-weight-bold text-grey-9 row items-center">
            <q-icon name="schedule" color="primary" class="q-mr-sm" />
            Daily Time Slots & Patient Assignments
          </div>
          <div class="text-caption text-grey-7">
            Highlighting occupied, completed, blocked, and vacant slots for
            {{ formattedSelectedDate }}
          </div>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-badge color="indigo-7" label="Occupied" />
          <q-badge color="positive" label="Completed" />
          <q-badge color="amber-9" label="Blocked Break" />
          <q-badge color="negative" label="Cancelled" />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="row justify-center q-py-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <!-- Slots Grid -->
      <div v-else class="column q-gutter-md">
        <div v-for="slot in computedTimeSlots" :key="slot.slotTime" class="slot-card-wrapper">
          <!-- OCCUPIED SLOT (Confirmed / Pending) -->
          <q-card
            v-if="slot.appointment && slot.appointment.status === 'confirmed'"
            flat
            bordered
            class="shadow-2 slot-card occupied-card"
          >
            <q-card-section class="row items-center justify-between q-col-gutter-md">
              <!-- Left: Time & Status -->
              <div class="col-12 col-sm-3 row items-center">
                <q-chip
                  color="indigo-7"
                  text-color="white"
                  icon="access_time"
                  class="text-weight-bold"
                >
                  {{ slot.slotTime }}
                </q-chip>
                <q-chip color="positive" text-color="white" size="sm" dense> CONFIRMED </q-chip>
              </div>

              <!-- Middle: Patient Details & Medical History Trigger -->
              <div class="col-12 col-sm-5">
                <div class="row items-center q-gutter-xs">
                  <q-icon name="person" color="indigo-8" size="sm" />
                  <!-- Patient Name Clickable to open Medical History -->
                  <span
                    class="text-subtitle1 text-weight-bold text-primary cursor-pointer hover-underline"
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
                    flat
                    round
                    dense
                    size="xs"
                    color="primary"
                    icon="history"
                    @click="
                      openPatientHistory(
                        slot.appointment.client_id,
                        slot.appointment.client_name,
                        slot.appointment.client_email,
                      )
                    "
                  >
                    <q-tooltip>View Patient Medical History</q-tooltip>
                  </q-btn>
                </div>
                <div class="text-caption text-grey-7 row items-center q-gutter-x-md">
                  <span v-if="slot.appointment.client_email">
                    <q-icon name="email" size="xs" class="q-mr-xs" />{{
                      slot.appointment.client_email
                    }}
                  </span>
                  <span>
                    <q-icon name="medical_services" size="xs" class="q-mr-xs" />{{
                      slot.appointment.service_title
                    }}
                  </span>
                  <span class="text-weight-bold text-primary">
                    ${{ Number(slot.appointment.total_amount).toFixed(2) }}
                  </span>
                </div>

                <!-- Attached Add-Ons Chip -->
                <div v-if="slot.appointment.add_ons_summary" class="q-mt-xs text-caption">
                  <q-chip color="blue-2" text-color="indigo-10" size="sm" icon="note_add">
                    Attached Tests: {{ slot.appointment.add_ons_summary }}
                  </q-chip>
                </div>
              </div>

              <!-- Right: Actions -->
              <div class="col-12 col-sm-4 row justify-end q-gutter-xs">
                <q-btn
                  color="positive"
                  unelevated
                  dense
                  class="q-px-xs"
                  icon="task_alt"
                  label="Complete Notes"
                  no-caps
                  @click="openCompleteDialog(slot.appointment)"
                />
                <q-btn
                  color="primary"
                  outline
                  dense
                  class="q-px-xs"
                  icon="add_circle"
                  label="Add Test"
                  no-caps
                  @click="openAddOnDialog(slot.appointment)"
                />
                <q-btn
                  color="negative"
                  flat
                  dense
                  class="q-px-xs"
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
            flat
            bordered
            class="shadow-1 slot-card completed-card"
          >
            <q-card-section class="column q-gutter-sm">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <q-chip
                    color="green-8"
                    text-color="white"
                    icon="access_time"
                    class="text-weight-bold"
                  >
                    {{ slot.slotTime }}
                  </q-chip>
                  <q-chip color="positive" text-color="white" size="sm" dense icon="check_circle">
                    COMPLETED
                  </q-chip>
                </div>
                <div class="text-caption text-grey-7">
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
              <div class="bg-green-1 text-positive q-pa-sm border-positive-soft rounded-borders">
                <div v-if="slot.appointment.clinical_notes" class="q-mb-xs">
                  <span class="text-weight-bold text-caption text-grey-9"
                    >📋 Diagnosis & Notes:
                  </span>
                  <span class="text-body2 text-grey-9"
                    >"{{ slot.appointment.clinical_notes }}"</span
                  >
                </div>
                <div v-if="slot.appointment.prescription">
                  <span class="text-weight-bold text-caption text-grey-9"
                    >💊 Prescription Summary:
                  </span>
                  <span class="text-body2 text-grey-9">{{ slot.appointment.prescription }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- BLOCKED BREAK SLOT -->
          <q-card
            v-else-if="slot.appointment && slot.appointment.status === 'blocked'"
            flat
            bordered
            class="shadow-1 slot-card blocked-card"
          >
            <q-card-section class="row items-center justify-between">
              <div class="row items-center q-gutter-md">
                <q-chip
                  color="amber-9"
                  text-color="white"
                  icon="free_breakfast"
                  class="text-weight-bold"
                >
                  {{ slot.slotTime }}
                </q-chip>
                <div>
                  <span class="text-subtitle2 text-weight-bold text-amber-9 row items-center">
                    <q-icon name="block" class="q-mr-xs" />
                    Doctor Break / Off-Duty Slot
                  </span>
                  <div class="text-caption text-grey-7">
                    Reason: "{{ slot.appointment.cancellation_reason || 'Lunch Break / Off-Duty' }}"
                  </div>
                </div>
              </div>

              <q-btn
                color="warning"
                outline
                dense
                class="q-px-sm"
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
            flat
            bordered
            class="shadow-1 slot-card cancelled-card"
          >
            <q-card-section class="column q-gutter-sm">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <q-chip
                    color="grey-7"
                    text-color="white"
                    icon="access_time"
                    class="text-weight-bold"
                  >
                    {{ slot.slotTime }}
                  </q-chip>
                  <q-chip color="negative" text-color="white" size="sm" dense icon="cancel">
                    CANCELLED
                  </q-chip>
                </div>
                <div class="text-caption text-grey-6">
                  Patient: <strong>{{ slot.appointment.client_name }}</strong> ({{
                    slot.appointment.service_title
                  }})
                </div>
              </div>

              <!-- Cancellation Reason Banner -->
              <div
                class="cancellation-reason-box bg-red-1 text-negative q-pa-sm border-negative-soft"
              >
                <div class="row items-center text-weight-bold text-caption">
                  <q-icon name="report_problem" class="q-mr-xs" />
                  Reason for Cancellation:
                </div>
                <div class="text-body2 text-grey-9 q-ml-md">
                  "{{
                    slot.appointment.cancellation_reason ||
                    'Cancelled by doctor due to schedule overlap'
                  }}"
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- VACANT SLOT -->
          <q-card v-else flat bordered class="shadow-0 slot-card vacant-card">
            <q-card-section class="row items-center justify-between">
              <div class="row items-center q-gutter-md">
                <q-chip
                  color="positive"
                  outline
                  icon="access_time"
                  class="text-weight-bold bg-white"
                >
                  {{ slot.slotTime }}
                </q-chip>
                <div>
                  <span class="text-subtitle2 text-weight-bold text-positive"
                    >Vacant / Available</span
                  >
                  <div class="text-caption text-grey-6">No patient booked for this time slot</div>
                </div>
              </div>

              <div class="row items-center q-gutter-sm">
                <q-btn
                  color="warning"
                  flat
                  dense
                  class="q-px-xs"
                  icon="block"
                  label="Mark Break / Off-Duty"
                  no-caps
                  @click="openBlockDialog(slot.hour)"
                />
                <q-chip color="green-2" text-color="positive" size="sm" icon="check_circle">
                  Open Slot
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- FEATURE 1: COMPLETE CONSULTATION & CLINICAL NOTES DIALOG -->
    <q-dialog v-model="completeModalOpen" persistent>
      <q-card style="min-width: 480px; border-radius: 16px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-positive">
          <div class="text-h6 text-weight-bold row items-center">
            <q-icon name="task_alt" class="q-mr-sm" size="sm" />
            Complete Consultation & Record Notes
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="targetAppointment" class="q-pt-none">
          <div class="q-mb-md bg-green-1 q-pa-sm text-caption rounded-borders text-grey-9">
            <div><strong>Patient:</strong> {{ targetAppointment.client_name }}</div>
            <div><strong>Service:</strong> {{ targetAppointment.service_title }}</div>
            <div><strong>Time:</strong> {{ formatTime(targetAppointment.start_time) }}</div>
          </div>

          <q-form @submit.prevent="confirmCompletion">
            <q-input
              v-model="clinicalNotesInput"
              type="textarea"
              outlined
              label="Diagnosis & Clinical Notes *"
              hint="Enter patient symptoms, diagnosis, or clinical observations"
              rows="3"
              class="q-mb-md"
              autofocus
              :rules="[(val) => (val && val.trim().length > 0) || 'Clinical notes are required']"
            />

            <q-input
              v-model="prescriptionInput"
              type="textarea"
              outlined
              label="Prescription & Medications Summary"
              hint="List prescribed medicines, dosage, or follow-up instructions"
              rows="2"
              class="q-mb-md"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat no-caps v-close-popup />
              <q-btn
                label="Save & Mark Completed"
                color="positive"
                type="submit"
                unelevated
                no-caps
                :loading="submittingComplete"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- FEATURE 2: BLOCK BREAK SLOT DIALOG -->
    <q-dialog v-model="blockModalOpen" persistent>
      <q-card style="min-width: 420px; border-radius: 16px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-warning">
          <div class="text-h6 text-weight-bold row items-center">
            <q-icon name="block" class="q-mr-sm" size="sm" />
            Mark Time Slot as Unavailable / Break
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-mb-md bg-amber-1 q-pa-sm text-caption rounded-borders text-grey-9">
            <div><strong>Selected Time Slot:</strong> {{ targetBlockHourLabel }}</div>
            <div><strong>Date:</strong> {{ formattedSelectedDate }}</div>
          </div>

          <q-form @submit.prevent="confirmBlockSlot">
            <q-input
              v-model="blockReasonInput"
              outlined
              label="Reason for Break / Off-Duty *"
              hint="e.g. Lunch Break, Emergency Surgery, Off-Duty"
              class="q-mb-md"
              autofocus
              :rules="[(val) => (val && val.trim().length > 0) || 'Reason is required']"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat no-caps v-close-popup />
              <q-btn
                label="Confirm Block"
                color="warning"
                type="submit"
                unelevated
                no-caps
                :loading="submittingBlock"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- FEATURE 3: PATIENT MEDICAL HISTORY DIALOG -->
    <q-dialog v-model="historyModalOpen">
      <q-card style="min-width: 540px; max-width: 700px; border-radius: 16px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-primary">
          <div class="row items-center q-gutter-sm">
            <q-avatar color="primary" text-color="white" icon="history" />
            <div>
              <div class="text-h6 text-weight-bold">{{ patientHistoryName }}</div>
              <div class="text-caption text-grey-7">{{ patientHistoryEmail }}</div>
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 420px" class="scroll">
          <div v-if="loadingHistory" class="row justify-center q-py-lg">
            <q-spinner-dots color="primary" size="36px" />
          </div>

          <div v-else-if="patientHistoryList.length === 0" class="text-center text-grey-6 q-py-lg">
            No previous consultation records found for this patient.
          </div>

          <div v-else class="column q-gutter-md">
            <q-card
              v-for="item in patientHistoryList"
              :key="item.id"
              flat
              bordered
              class="bg-grey-1"
              style="border-radius: 12px"
            >
              <q-card-section class="q-pa-sm column q-gutter-xs">
                <div class="row items-center justify-between">
                  <span class="text-weight-bold text-primary">
                    {{ formatDateShort(item.start_time) }} - {{ item.service_title }}
                  </span>
                  <q-chip
                    :color="getStatusColor(item.status)"
                    text-color="white"
                    size="xs"
                    class="text-weight-bold"
                  >
                    {{ item.status.toUpperCase() }}
                  </q-chip>
                </div>

                <div class="text-caption text-grey-7">
                  Provider: <strong>{{ item.doctor_name }}</strong>
                </div>

                <div v-if="item.add_ons_summary" class="text-caption text-indigo-9">
                  Tests/Add-Ons: {{ item.add_ons_summary }}
                </div>

                <div
                  v-if="item.clinical_notes"
                  class="bg-white q-pa-xs rounded-borders text-caption text-grey-9"
                >
                  <strong>Diagnosis:</strong> "{{ item.clinical_notes }}"
                </div>

                <div
                  v-if="item.prescription"
                  class="bg-white q-pa-xs rounded-borders text-caption text-grey-9"
                >
                  <strong>Prescription:</strong> {{ item.prescription }}
                </div>

                <div
                  v-if="item.status === 'cancelled' && item.cancellation_reason"
                  class="text-caption text-negative"
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
      <q-card style="min-width: 460px; border-radius: 16px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-primary">
          <div class="text-h6 text-weight-bold row items-center">
            <q-icon name="medical_services" class="q-mr-sm" size="sm" />
            Add Recommended Test / Service
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="targetAppointment" class="q-pt-none">
          <div class="q-mb-md bg-blue-1 q-pa-sm text-caption rounded-borders text-indigo-10">
            <div><strong>Patient:</strong> {{ targetAppointment.client_name }}</div>
            <div><strong>Primary Service:</strong> {{ targetAppointment.service_title }}</div>
            <div>
              <strong>Current Total:</strong> ${{
                Number(targetAppointment.total_amount).toFixed(2)
              }}
            </div>
            <div v-if="unattachedSelectedCount > 0" class="text-weight-bold text-primary q-mt-xs">
              Estimated Updated Total: ${{ estimatedNewTotal.toFixed(2) }}
            </div>
          </div>

          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            Select Add-On Services / Diagnostic Tests:
          </div>

          <div v-if="loadingAddOns" class="row justify-center q-py-md">
            <q-spinner-dots color="primary" size="30px" />
          </div>

          <q-form v-else @submit.prevent="submitAddOns">
            <div class="column q-gutter-xs q-mb-md">
              <div
                v-for="addon in availableAddOns"
                :key="addon.id"
                class="q-pa-sm border-grey rounded-borders row items-center justify-between bg-grey-1"
              >
                <!-- Already attached state -->
                <div
                  v-if="isAddOnAttached(addon.id)"
                  class="row items-center justify-between full-width"
                >
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="check_circle" color="positive" size="sm" />
                    <div>
                      <div class="text-weight-bold text-body2 text-grey-8">{{ addon.title }}</div>
                      <div class="text-caption text-grey-6">{{ addon.description }}</div>
                    </div>
                  </div>
                  <q-chip color="positive" text-color="white" size="xs" class="text-weight-bold">
                    Already Attached (+${{ Number(addon.price).toFixed(2) }})
                  </q-chip>
                </div>

                <!-- Selectable unattached state -->
                <template v-else>
                  <q-checkbox v-model="selectedAddOnIds" :val="addon.id" color="primary">
                    <template #default>
                      <div>
                        <div class="text-weight-bold text-body2 text-grey-9">{{ addon.title }}</div>
                        <div class="text-caption text-grey-7">{{ addon.description }}</div>
                      </div>
                    </template>
                  </q-checkbox>
                  <span class="text-weight-bold text-primary q-ml-sm"
                    >+${{ Number(addon.price).toFixed(2) }}</span
                  >
                </template>
              </div>
            </div>

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat no-caps v-close-popup />
              <q-btn
                label="Attach Selected Services"
                color="primary"
                type="submit"
                unelevated
                no-caps
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
      <q-card style="min-width: 420px; border-radius: 16px" class="q-pa-sm">
        <q-card-section class="row items-center justify-between text-negative">
          <div class="text-h6 text-weight-bold row items-center">
            <q-icon name="warning" class="q-mr-sm" size="sm" />
            Cancel Appointment
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="targetAppointment" class="q-pt-none">
          <div class="q-mb-md bg-grey-2 q-pa-sm text-caption rounded-borders">
            <div><strong>Patient:</strong> {{ targetAppointment.client_name }}</div>
            <div><strong>Service:</strong> {{ targetAppointment.service_title }}</div>
            <div><strong>Time:</strong> {{ formatTime(targetAppointment.start_time) }}</div>
          </div>

          <q-form @submit.prevent="confirmCancellation">
            <q-input
              v-model="cancelReasonInput"
              type="textarea"
              outlined
              label="Reason for Cancellation *"
              hint="Please explain why this appointment is being cancelled"
              rows="3"
              autofocus
              :rules="[
                (val) => (val && val.trim().length > 0) || 'Cancellation reason is required',
              ]"
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn label="Dismiss" flat no-caps v-close-popup />
              <q-btn
                label="Confirm Cancellation"
                color="negative"
                type="submit"
                unelevated
                no-caps
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
    weekday: 'long',
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
  const d = new Date(dateTimeStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  if (status === 'completed') return 'positive';
  if (status === 'confirmed') return 'primary';
  if (status === 'cancelled') return 'negative';
  if (status === 'blocked') return 'amber-9';
  return 'grey-7';
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
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(
      `${API_BASE}/appointments/doctor?doctorId=${currentDoctorId.value}&t=${Date.now()}`,
    );

    if (response.ok) {
      const data = await response.json();
      appointments.value = data;
    } else {
      appointments.value = [];
    }
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
  if (!targetAppointment.value || !clinicalNotesInput.value.trim()) return;

  submittingComplete.value = true;
  try {
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/appointments/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: targetAppointment.value.id,
        clinicalNotes: clinicalNotesInput.value.trim(),
        prescription: prescriptionInput.value.trim(),
      }),
    });

    if (response.ok) {
      if (targetAppointment.value) {
        targetAppointment.value.status = 'completed';
        targetAppointment.value.clinical_notes = clinicalNotesInput.value.trim();
        targetAppointment.value.prescription = prescriptionInput.value.trim();
      }
      await fetchAppointments();
    }
  } catch (err) {
    console.error('Failed to complete consultation:', err);
  } finally {
    submittingComplete.value = false;
    completeModalOpen.value = false;
  }
};

// FEATURE 2: BLOCK OUT BREAK SLOTS
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

    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/appointments/block-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: currentDoctorId.value,
        startTime: startTimeStr,
        breakReason: blockReasonInput.value.trim(),
      }),
    });

    if (response.ok) {
      await fetchAppointments();
    }
  } catch (err) {
    console.error('Failed to block slot:', err);
  } finally {
    submittingBlock.value = false;
    blockModalOpen.value = false;
  }
};

const unblockSlot = async (appointmentId: number) => {
  try {
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/appointments/unblock-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    });

    if (response.ok) {
      await fetchAppointments();
    }
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
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/patient/history?clientId=${clientId}`);
    if (response.ok) {
      patientHistoryList.value = await response.json();
    }
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
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/add-ons`);
    if (response.ok) {
      availableAddOns.value = await response.json();
    }
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
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/appointments/add-ons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: targetAppointment.value.id,
        addOnIds: newlySelectedIds,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.pricing && targetAppointment.value) {
        targetAppointment.value.total_amount = result.pricing.totalAmount;
      }
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
    const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_BASE}/appointments/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: targetId,
        status: 'cancelled',
        cancellationReason: reasonText,
        cancellation_reason: reasonText,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status on server');
    }

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
  max-width: 1050px;
}

.fill-height {
  height: 100%;
}

.slot-card {
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
}

.slot-card:hover {
  transform: translateY(-2px);
}

.occupied-card {
  border-left: 6px solid #3f51b5;
  background-color: #f5f7ff;
}

.completed-card {
  border-left: 6px solid #2e7d32;
  background-color: #f1f8e9;
}

.blocked-card {
  border-left: 6px solid #ff8f00;
  background-color: #fff8e1;
}

.cancelled-card {
  border-left: 6px solid #f44336;
  background-color: #fff9f9;
}

.vacant-card {
  border: 1px dashed #4caf50;
  background-color: #f6fff7;
}

.cancellation-reason-box {
  border-radius: 8px;
  border-left: 4px solid #f44336;
}

.border-grey {
  border: 1px solid #e0e0e0;
}

.border-positive-soft {
  border-left: 4px solid #2e7d32;
}

.hover-underline:hover {
  text-decoration: underline;
}
</style>
