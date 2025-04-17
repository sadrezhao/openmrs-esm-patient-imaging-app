import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { createErrorHandler, ErrorState, ExtensionSlot, showSnackbar, useLayoutType, showModal } from '@openmrs/esm-framework';
import { usePatientChartStore, type DefaultPatientWorkspaceProps,} from '@openmrs/esm-patient-common-lib';

import {
    Button,
    ComboBox,
    Form,
    InlineLoading,
    Stack,
} from '@carbon/react';
import { DicomStudy, OrthancConfiguration } from '../../types';
import { useSynchronizeStudies, useOrthancConfigurations } from '../../api';
import styles from './studies.scss'
import { Row } from '@carbon/react';
import { FormGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import { RadioButtonGroup } from '@carbon/react';
import { ButtonSet } from '@carbon/react';
import SynchronizedStudiesModal from './synchronized-studies.modal'

export default function SynchronizeStudiesWorkspace(props: DefaultPatientWorkspaceProps) {
    const { t } = useTranslation();
    const { closeWorkspace, patientUuid } = props;
    const isTablet = useLayoutType() === 'tablet';
    const [retrievedStudies, setRetrievedStudies] = useState<DicomStudy[]>([]);
    const [selectedServer, setSelectedServer] = useState('all');
    const orthancConfigurations = useOrthancConfigurations();
    const [fetchOption, setSelectedFetchOption] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    // const [showModal, setShowModal] = useState(false);
    const [configError, setConfigError] = useState(orthancConfigurations?.error);
    const [hasSelectedServer, setHasSelectedServer] = useState(false);
    const { patient } = usePatientChartStore();

    const patientState = useMemo(() => ({ patient }), [patient]);

    const handleChange = (value: string) => {
        setSelectedFetchOption(value);
    };
    
    const fetchOptions = [
        {
          uuid: 'all',
          key: 'all',
          display: t('all', 'All'),
        },
        {
          uuid: 'newest',
          key: 'newest',
          display: t('newest', 'Newest'),
        },
    ];

    const launchSynchronizeStudiesDialog = (retrievedStudies: Array<DicomStudy>) => {
        const dispose = showModal('synchronize-studies-dialog', {
          onClose: () => dispose(),
          retrievedStudies,
          patientUuid,
        });
    };
    

    const handleSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setIsLoading(true);
            const abortController = new AbortController();

            setHasSelectedServer(true);
            if (!selectedServer) {
                setHasSelectedServer(false);
                return;
            }
            
            useSynchronizeStudies(fetchOption, selectedServer, abortController)
            .then((response) => {
                if (response?.data) {
                    setRetrievedStudies(response.data);
                    // setShowModal(true);
                    launchSynchronizeStudiesDialog(retrievedStudies);
                }
                if(response?.error) {
                    setConfigError(response.error)
                }
            })
            .catch(() => {
                createErrorHandler();
                showSnackbar({
                    title: t('synchronizeStudiesError', 'SynchronizeStudiesError'),
                    kind: 'error',
                    isLowContrast: false,
                    subtitle: t('checkForConnection', 'CheckForConnection'),
                });
            })
            .finally(() => {
                abortController.abort();
                setIsLoading(false);

            })

    }, [closeWorkspace, selectedServer, t, retrievedStudies])

    if(configError) {
        return <ErrorState error={configError} headerTitle={t('loadConfigurationError', 'LoadConfigurationError')} />;
    }

    return (
        <>
            {isLoading && <InlineLoading description={t('retrievingStudies', 'Retrieving studies...')} />}
            <Form
                className={styles.formContainer} onSubmit={handleSubmit}
            >
                {isTablet ? (
                    <Row className={styles.header}>
                        <ExtensionSlot className={styles.content} name="patient-details-header-slot" state={patientState} />
                    </Row>
                ) : null}

                <div className={styles.form}>
                    <Stack gap={5} className={styles.formContent}>
                    <FormGroup legendText={t('synchronizeFetchOption', 'SynchronizeFetchOption')}>
                        <RadioButtonGroup
                            name="synchronizeFetchOption"
                            valueSelected={fetchOption}
                            onChange={handleChange} 
                        >
                            {fetchOptions.map(({ key, display, uuid }) => (
                            <RadioButton
                                id={key}
                                key={key}
                                labelText={display}
                                value={uuid}
                            />
                            ))}
                        </RadioButtonGroup>
                    </FormGroup>
                    <ComboBox
                        id="orthancConfigurationId"
                        items={(orthancConfigurations && orthancConfigurations.data) ?? []}
                        itemToString={(item: OrthancConfiguration) => item?.orthancBaseUrl || ''}
                        titleText={t('selectOrthancServer', 'SelectOrthancServer')}
                        onChange={({ selectedItem }) => setSelectedServer(selectedItem)}
                        placeholder={t('selectOrthancServer', 'SelectOrthancServer')}
                        invalid={hasSelectedServer && !selectedServer}
                        invalidText={t('orthancServerRequired', 'Please select an Orthanc server')}
                    />
                    <ButtonSet
                        className={classNames(isTablet ? styles.tabletButtons : styles.desktopButtons)}>
                        <Button type="submit" kind="primary">
                            {t('start', 'Start')}
                        </Button>
                        <Button kind="secondary" onClick={closeWorkspace}>
                            {t('cancel', 'Cancel')}
                        </Button>
                    </ButtonSet>
                    </Stack>
                </div>
            </Form>
            {/* {showModal ? launchDeleteAllergyDialog(retrievedStudies):null } */}
            {/* {showModal && (
                <SynchronizedStudiesModal
                    onClose={() => setShowModal(false)} 
                    studies={retrievedStudies}
                    patientUuid={patientUuid} 
                />
             )
            } */}
        </>
    );
}