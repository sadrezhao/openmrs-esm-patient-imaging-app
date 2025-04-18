import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequests, useStudies } from '../../api'
import { DataTableSkeleton } from '@carbon/react';
import { EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { useLayoutType } from '@openmrs/esm-framework';
import PatientStudiesTable from '../components/studies-details-table.component';
import RequestProcedureTable from '../components/requests-details-table.component';

interface ImagingDetailedSummaryProps {
    patient: fhir.Patient;
    patientUuid: string;
}

export default function ImagingDetailedSummary({patient, patientUuid}: ImagingDetailedSummaryProps) {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';

  const {
    data: studies,
    error: studiesError,
    isLoading: isLoadingPatientStudies,
    isValidating: isValidatingStudies,
  } = useStudies(patientUuid);

  const {
    data: requests,
    error: requestError,
    isLoading: isLoadingRequests,
    isValidating: isValidatingRequest,
  } = useRequests(patientUuid)

  return (
    <div>
      <div style={{ marginBottom: '2rem'}}>
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
                showCheckboxColumn={false}
                patientUuid={patientUuid} 
                />
              )
          }
          return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
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
                  patientUuid={patientUuid}
                />
              )
            }
            return <EmptyState displayText={displayText} headerTitle={headerTitle}/>;
        })()}
      </div>
    </div>
  )
}