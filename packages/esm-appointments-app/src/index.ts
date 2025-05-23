import {
  defineConfigSchema,
  defineExtensionConfigSchema,
  getAsyncLifecycle,
  getSyncLifecycle,
  registerBreadcrumbs,
} from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { createDashboardLink } from './createDashboardLink.component';
import { dashboardMeta, appointmentCalendarDashboardMeta, patientChartDashboardMeta } from './dashboard.meta';
import {
  cancelledAppointmentsPanelConfigSchema,
  checkedInAppointmentsPanelConfigSchema,
  completedAppointmentsPanelConfigSchema,
  earlyAppointmentsPanelConfigSchema,
  expectedAppointmentsPanelConfigSchema,
  missedAppointmentsPanelConfigSchema,
} from './scheduled-appointments-config-schema';
import rootComponent from './root.component';
import appointmentsDashboardComponent from './appointments.component';
import homeAppointmentsComponent from './home/home-appointments.component';
import appointmentsListComponent from './appointments/scheduled/appointments-list.component';
import earlyAppointmentsComponent from './appointments/scheduled/early-appointments.component';
import appointmentsFormComponent from './form/appointments-form.component';
import patientSearch from './patient-search/patient-search.component';
export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@kenyaemr/esm-appointments-app';

const options = {
  featureName: 'appointments',
  moduleName,
};

export function startupApp() {
  const appointmentsBasePath = `${window.spaBase}/home/appointments`;

  defineConfigSchema(moduleName, configSchema);

  defineExtensionConfigSchema('expected-appointments-panel', expectedAppointmentsPanelConfigSchema);
  defineExtensionConfigSchema('checked-in-appointments-panel', checkedInAppointmentsPanelConfigSchema);
  defineExtensionConfigSchema('completed-appointments-panel', completedAppointmentsPanelConfigSchema);
  defineExtensionConfigSchema('missed-appointments-panel', missedAppointmentsPanelConfigSchema);
  defineExtensionConfigSchema('cancelled-appointments-panel', cancelledAppointmentsPanelConfigSchema);
  defineExtensionConfigSchema('early-appointments-panel', earlyAppointmentsPanelConfigSchema);

  registerBreadcrumbs([
    {
      title: 'Appointments',
      path: appointmentsBasePath,
      parent: `${window.spaBase}/home`,
    },
    {
      path: `${window.spaBase}/patient-list/:forDate/:serviceName`,
      title: ([_, serviceName]) => `Patient Lists / ${decodeURI(serviceName)}`,
      parent: `${window.spaBase}`,
    },
  ]);
}

export const root = getSyncLifecycle(rootComponent, options);

export const appointmentsDashboardLink = getSyncLifecycle(createDashboardLink(dashboardMeta), options);

export const appointmentsCalendarDashboardLink = getSyncLifecycle(
  createDashboardLink(appointmentCalendarDashboardMeta),
  options,
);

export const appointmentsDashboard = getSyncLifecycle(appointmentsDashboardComponent, options);

export const homeAppointments = getSyncLifecycle(homeAppointmentsComponent, options);

export const appointmentsList = getSyncLifecycle(appointmentsListComponent, options);

export const earlyAppointments = getSyncLifecycle(earlyAppointmentsComponent, options);

export const appointmentsForm = getSyncLifecycle(appointmentsFormComponent, options);

export const searchPatient = getSyncLifecycle(patientSearch, options);

// t('Appointments', 'Appointments')
export const patientAppointmentsSummaryDashboardLink = getAsyncLifecycle(async () => {
  const commonLib = await import('@openmrs/esm-patient-common-lib');
  return {
    default: commonLib.createDashboardLink(patientChartDashboardMeta),
  };
}, options);

export const patientAppointmentsDetailedSummary = getAsyncLifecycle(
  () => import('./patient-appointments/patient-appointments-detailed-summary.component'),
  options,
);

export const patientAppointmentsOverview = getAsyncLifecycle(
  () => import('./patient-appointments/patient-appointments-overview.component'),
  options,
);

export const patientUpcomingAppointmentsWidget = getAsyncLifecycle(
  () => import('./patient-appointments/patient-upcoming-appointments-card.component'),
  options,
);

export const patientAppointmentsCancelConfirmationDialog = getAsyncLifecycle(
  () => import('./patient-appointments/patient-appointments-cancel.modal'),
  options,
);

export const appointmentsFormWorkspace = getAsyncLifecycle(() => import('./form/appointments-form.component'), options);

export const endAppointmentModal = getAsyncLifecycle(
  () => import('./appointments/common-components/end-appointment.modal'),
  options,
);

export const homeAppointmentsTile = getAsyncLifecycle(
  () => import('./homepage-tile/appointments-tile.component'),
  options,
);
