import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequestsByPatient, useStudiesByPatient } from '../../api';
import { DataTableSkeleton } from '@carbon/react';
import { CardHeader, EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { AddIcon, launchWorkspace, useLayoutType } from '@openmrs/esm-framework';
import StudiesDetailTable from '../components/studies-details-table.component';
import RequestProcedureTable from '../components/requests-details-table.component';
import { addNewRequestWorkspace, linkStudiesFormWorkspace, uploadStudiesFormWorkspace } from '../constants';
import { Button } from '@carbon/react';

interface ImagingDetailedSummaryProps {
  patientUuid: string;
}

export default function ImagingDetailedSummary({ patientUuid }: ImagingDetailedSummaryProps) {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';
  const launchUploadStudiesWorkspace = useCallback(() => launchWorkspace(uploadStudiesFormWorkspace), []);
  const launchLinkStudiesWorkspace = useCallback(() => launchWorkspace(linkStudiesFormWorkspace), []);
  const launchAddRequestWorkspace = useCallback(() => launchWorkspace(addNewRequestWorkspace), []);
  const headerTitle = t('managerStudies', 'Manager studies');

  const {
    data: studies,
    error: studiesError,
    isLoading: isLoadingPatientStudies,
    isValidating: isValidatingStudies,
  } = useStudiesByPatient(patientUuid);

  const {
    data: requests,
    error: requestError,
    isLoading: isLoadingRequests,
    isValidating: isValidatingRequest,
  } = useRequestsByPatient(patientUuid);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        {/* <div> */}
        <CardHeader title={headerTitle}>
          <Button
            kind="ghost"
            renderIcon={(props) => <AddIcon size={16} {...props} />}
            iconDescription={t('linkStudies', 'Studies')}
            onClick={launchLinkStudiesWorkspace}
          >
            {t('linkStudie', 'Link studies')}
          </Button>
          <Button
            kind="ghost"
            renderIcon={(props) => <AddIcon size={16} {...props} />}
            iconDescription={t('upload', 'Upload')}
            onClick={launchUploadStudiesWorkspace}
          >
            {t('upload', 'Upload')}
          </Button>
        </CardHeader>
        {/* </div> */}
        {(() => {
          const displayText = t('studies', 'studies');
          const headerTitle = t('Studies', 'Studies');

          if (isLoadingPatientStudies) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;

          if (studiesError) return <ErrorState error={studiesError} headerTitle={headerTitle} />;

          if (studies?.length) {
            return (
              <StudiesDetailTable
                isValidating={isValidatingStudies}
                studies={studies}
                showDeleteButton={true}
                patientUuid={patientUuid}
              />
            );
          }
          return (
            <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchUploadStudiesWorkspace} />
          );
        })()}
      </div>
      <div>
        {(() => {
          const displayText = t('worklist', 'Worklist');
          const headerTitle = t('worklist', 'Worklist');

          if (isLoadingRequests) return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;

          if (requestError) return <ErrorState error={requestError} headerTitle={headerTitle} />;
          if (requests?.length > 0) {
            return (
              <RequestProcedureTable
                isValidating={isValidatingRequest}
                requests={requests}
                showDeleteButton={true}
                patientUuid={patientUuid}
              />
            );
          }
          return (
            <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchAddRequestWorkspace} />
          );
        })()}
      </div>
    </div>
  );
}
