import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { ErrorState, ExtensionSlot, ResponsiveWrapper, useLayoutType } from '@openmrs/esm-framework';
import { EmptyState, type DefaultPatientWorkspaceProps,} from '@openmrs/esm-patient-common-lib';

import {
    Button,
    Form,
    InlineLoading,
    Stack,
} from '@carbon/react';
import { DicomStudy, OrthancConfiguration } from '../../types';
import { assignStudy as assignStudy, getStudiesByConfig } from '../../api';
import AssignStudiesTable from '../components/assign-studies-table.component';
import { Row } from '@carbon/react';
import { ButtonSet } from '@carbon/react';
import styles from './studies.scss'
import { DataTableSkeleton } from '@carbon/react';

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

    const { 
        data: studiesData, 
        error: assignStudyError,
        isLoading: isLoadingStudies,
        isValidating: isValidatingStudies
    } = getStudiesByConfig(configuration, patientUuid)

        
    function assignStudyFunction(study: DicomStudy, isAssign: boolean) {
        const abortController = new AbortController();
        assignStudy(study.id, patientUuid, isAssign, abortController);
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