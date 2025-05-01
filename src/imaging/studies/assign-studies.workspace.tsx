import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { ErrorState, ExtensionSlot, ResponsiveWrapper, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { EmptyState, type DefaultPatientWorkspaceProps,} from '@openmrs/esm-patient-common-lib';

import {
    Button,
    Form,
    InlineLoading,
    Stack,
} from '@carbon/react';
import { DicomStudy, OrthancConfiguration } from '../../types';
import { assignStudy as assignStudy, getStudiesByConfig, getStudiesByPatient } from '../../api';
import AssignStudiesTable from '../components/assign-studies-table.component';
import { Row } from '@carbon/react';
import { ButtonSet } from '@carbon/react';
import { DataTableSkeleton } from '@carbon/react';
import styles from './studies.scss'

interface AssignStudiesWorkspaceProps extends DefaultPatientWorkspaceProps {
    configuration: OrthancConfiguration;
}

const AssignStudiesWorkspace: React.FC<AssignStudiesWorkspaceProps> = ({
    patientUuid,
    configuration,
    closeWorkspace,
}) => {
    const { t } = useTranslation();
    const layout = useLayoutType();
    const isTablet = useLayoutType() === 'tablet';
    const isDesktop = layout === 'small-desktop' || layout === 'large-desktop';
    const [isLoading, setIsLoading] = useState(false);
    const patientState = useMemo(() => ({ patientUuid }), [patientUuid]);
    const { mutate } = getStudiesByPatient(patientUuid);

    const { 
        data: studiesData, 
        error: assignStudyError,
        isLoading: isLoadingStudies,
        isValidating: isValidatingStudies
    } = getStudiesByConfig(configuration, patientUuid)

        
    async function assignStudyFunction(study: DicomStudy, isAssign: boolean) {
        const abortController = new AbortController();
        try{
          await assignStudy(study.id, patientUuid, isAssign, abortController);
          mutate();
          showSnackbar({
            kind: 'success',
            title: isAssign ? t('studyAssigned', 'Study is assigned successfully') :  t('removeAssign', 'Assignment of the study is removed'),
          });
        } catch (err: any) {
            showSnackbar({
              title: isAssign? t('errorAssign', 'Error assigning study'): t('errorRemoveAssign', 'Error: Failed to remove the study assignment.'),
              kind: 'error',
              subtitle: err?.message,
              isLowContrast: false,
            });
         }
    }

    return (
        <>
          {isLoading && (
            <InlineLoading description={t('FetchingStudies', 'Fetching studies...')} />
          )}
    
          <Form className={styles.formContainer} id="assignStudies">
            {isTablet ? (
              <Row className={styles.header}>
                <ExtensionSlot
                  className={styles.content}
                  name="patient-details-header-slot"
                  state={patientState}
                />
              </Row>
            ) : null}
            {(() => {
              const displayText = t('studies', 'studies');
              const headerTitle = t('Studies', 'Studies')
      
              if (isLoadingStudies)
                return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;
      
              if (assignStudyError)
                return <ErrorState error={assignStudyError} headerTitle={headerTitle} />;

              return (
                <Stack gap={2} className={styles.formContent}>
                  {studiesData?.studies.length > 0 ? (
                    <section>
                      <ResponsiveWrapper>
                        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                          <AssignStudiesTable
                            data={studiesData}
                            patientUuid={patientUuid}
                            assignStudyFunction={(study: DicomStudy, isAssign: boolean) =>
                              assignStudyFunction(study, isAssign)
                            }
                          />
                        </div>
                      </ResponsiveWrapper>
                    </section>
                  ) : (
                    <EmptyState displayText={displayText} headerTitle={headerTitle} />
                  )}
                  <ButtonSet
                    className={classNames(
                      isTablet ? styles.tabletButtons : styles.desktopButtons
                    )}
                  >
                    <Button kind="secondary" onClick={closeWorkspace}>
                      {t('close', 'Close')}
                    </Button>
                  </ButtonSet>
                </Stack>
              );
            })()}
          </Form>
        </>
      );
}

export default AssignStudiesWorkspace;