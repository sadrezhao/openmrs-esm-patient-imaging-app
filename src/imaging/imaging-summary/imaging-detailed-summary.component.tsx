import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequests, useStudies } from '../../api'
import { DataTableSkeleton } from '@carbon/react';
import { EmptyState, ErrorState, launchPatientWorkspace} from '@openmrs/esm-patient-common-lib';
import { useLayoutType } from '@openmrs/esm-framework';
import PatientStudiesTable from '../components/studies-details-table.component';
import RequestProcedureTable from '../components/requests-details-table.component';

interface ImagingDetailedSummaryProps {
    patient: fhir.Patient;
}

export default function ImagingDetailedSummary({patient}: ImagingDetailedSummaryProps) {
  const { t } = useTranslation();
  const launchUploadStudiesForm = useCallback(() => launchPatientWorkspace("upload-studies-workspace"), []);
  const launchAddRequestProcedureForm = useCallback(() => launchPatientWorkspace("add-requestProcedure-workspace"), []);
  const layout = useLayoutType();
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const {
    data: studies,
    error: studiesError,
    isLoading: isLoadingPatientStudies,
    isValidating: isValidatingStudies,
  } = useStudies(patient?.id);

  const {
    data: requests,
    error: requestError,
    isLoading: isLoadingRequests,
    isValidating: isValidatingRequest,
  } = useRequests(patient?.id)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem'}}>
        {(() => {
          const displayText = t('studies', 'studies');
          const headerTitle = t('Studies', 'Studies');

          if (isLoadingPatientStudies) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra/>;
          
          if (studiesError) return <ErrorState error={studiesError} headerTitle={headerTitle} />;

          if (studies?.length) {
            return (
                <PatientStudiesTable 
                  isValidating={isValidatingStudies}
                  studies={studies}
                  showDeleteButton={true}
                  patient={patient}              
              />
            );
          }
          return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchUploadStudiesForm} />;
        })()}
      </div>
      <div>
        {(() => {
            const displayText = t('worklist', 'Worklist');
            const headerTitle = t('worklist', 'Worklist');

            if(isLoadingRequests) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />

            if (requestError) return <ErrorState error={requestError} headerTitle={headerTitle} />
            if (requests?.length) {
              return (
                <RequestProcedureTable
                  isValidating={isValidatingRequest}
                  requests={requests}
                  showDeleteButton={true}
                  patient={patient}
                />
              )
            }
            return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchAddRequestProcedureForm} />;
        })()}
      </div>
    </div>
  )
}