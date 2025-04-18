import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { createErrorHandler, ErrorState, ExtensionSlot, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { usePatientChartStore, type DefaultPatientWorkspaceProps,} from '@openmrs/esm-patient-common-lib';

import {
    Button,
    ComboBox,
    Form,
    InlineLoading,
    Stack,
} from '@carbon/react';
import { DicomStudy, OrthancConfiguration } from '../../types';
import { useSynchronizeStudies, useOrthancConfigurations, useMappingStudy } from '../../api';
import styles from './studies.scss'
import { Row } from '@carbon/react';
import { FormGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import { RadioButtonGroup } from '@carbon/react';
import { ButtonSet } from '@carbon/react';
import PatientStudiesTable from '../components/studies-details-table.component';

export default function SynchronizeStudiesWorkspace(props: DefaultPatientWorkspaceProps) {
    const { t } = useTranslation();
    const { closeWorkspace, patientUuid } = props;
    const isTablet = useLayoutType() === 'tablet';
    const [retrievedStudies, setRetrievedStudies] = useState(Array<DicomStudy>());
    const [selectedServer, setSelectedServer] = useState();
    const orthancConfigurations = useOrthancConfigurations();
    const [fetchOption, setSelectedFetchOption] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [configError, setConfigError] = useState(orthancConfigurations?.error);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showRetrievedStudies, setShowRetrievedStudies] = useState(false);
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
    
    const handleSynchronize = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setHasSubmitted(true);
            const abortController = new AbortController();

            if (!selectedServer) {
                return;
            }
            
            useSynchronizeStudies(fetchOption, selectedServer, abortController)
            .then((response) => {
                if (!response.isLoading && !response.isValidating && response?.data ) {
                    setRetrievedStudies(response.data);
                    setIsLoading(response.isLoading);
                    setIsValidating(response.isValidating);
                    setShowRetrievedStudies(true);
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
                className={styles.formContainer} onSubmit={handleSynchronize}
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
                        items={[
                            { orthancBaseUrl: 'all', name: 'All Servers' },
                            ...(orthancConfigurations?.data ?? [])
                        ]}
                        itemToString={(item: OrthancConfiguration | undefined) => item?.orthancBaseUrl === 'all'
                            ? 'All Servers'
                            : item?.orthancBaseUrl || ''
                        }
                        titleText={t('selectOrthancServer', 'SelectOrthancServer')}
                        seletedItem={selectedServer}
                        onChange={({ selectedItem }) => setSelectedServer(selectedItem)}
                        placeholder={t('selectOrthancServer', 'SelectOrthancServer')}
                        invalid={hasSubmitted && !selectedServer}
                        invalidText={t('orthancServerRequired', 'Please select an Orthanc server')}
                    />
                    { showRetrievedStudies && (
                            <div style={{marginTop: '1rem', marginBottom: '1rem'}}>
                                <PatientStudiesTable 
                                    isValidating={isValidating}
                                    studies={retrievedStudies}
                                    showDeleteButton={false}
                                    showCheckboxColumn={true}
                                    patientUuid={patientUuid} 
                                />
                            </div>
                        )
                    }
                    <ButtonSet
                        className={classNames(isTablet ? styles.tabletButtons : styles.desktopButtons)}>
                        <Button kind="primary" onClick={handleSynchronize}>
                            {t('Synchronize', 'Synchronize')}
                        </Button>
                        <Button kind="third" onClick={closeWorkspace}>
                            {t('cancel', 'Cancel')}
                        </Button>
                    </ButtonSet>
                    </Stack>
                </div>
            </Form>
        </>
    );
}