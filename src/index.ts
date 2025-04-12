import {
  getAsyncLifecycle,
  getSyncLifecycle,
  defineConfigSchema,
  fhirBaseUrl,
  messageOmrsServiceWorker,
  restBaseUrl,
  translateFrom,
  } from '@openmrs/esm-framework';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import { dashboardMeta } from './dashboard.meta';
import { configSchema } from './config-schema';
import ImagingDetailedSummaryComponent from './imaging/imaging-summary/imaging-detailed-summary.component';


const moduleName = '@openmrs/esm-patient-imaging-app';

const options = {
  featureName: 'patient-imaging',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// export const root = getAsyncLifecycle(() => import('./root.component'), options);

export const imagingDashboardLink = getSyncLifecycle(
  createDashboardLink({
    ...dashboardMeta,
    moduleName,
  }),
  options,
);

// export const studiesWorkspace = getAsyncLifecycle(
//  () => import('./imaging/studies/studies.workspace'),
//  options,
// );

// export const worklistWorkspace = getAsyncLifecycle(
//  () => import('./imaging/worklist/requestProcedure.workspace'),
//  options,
// );

export const imagingDetailedSummary = getSyncLifecycle(ImagingDetailedSummaryComponent, options);


