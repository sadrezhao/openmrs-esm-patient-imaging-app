import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { createErrorHandler, ExtensionSlot, launchWorkspace, ResponsiveWrapper, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { type DefaultPatientWorkspaceProps,} from '@openmrs/esm-patient-common-lib';

import {
    Button,
    ComboBox,
    Form,
    InlineLoading,
    Stack,
} from '@carbon/react';
import { OrthancConfiguration } from '../../types';
import { getLinkStudies, getOrthancConfigurations, getStudiesByPatient } from '../../api';
import { Row } from '@carbon/react';
import { FormGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import { RadioButtonGroup } from '@carbon/react';
import { ButtonSet } from '@carbon/react';
import { z } from 'zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './studies.scss'
import { assignStudiesFormWorkspace } from '../constants';


const LinkStudiesWorkspace: React.FC<DefaultPatientWorkspaceProps> = ({
    patientUuid,
    closeWorkspace,
}) => {
    const { t } = useTranslation();
    const isTablet = useLayoutType() === 'tablet';
    const orthancConfigurations = getOrthancConfigurations();
    const [isLoading, setIsLoading] = useState(false);
    const patientState = useMemo(() => ({ patientUuid }), [patientUuid]);

    const linkStudiesFormSchema = useMemo(() => {
        return z.object({
            fetchOption: z.string(),
                orthancConfiguration: z.object({
                    id: z.number(),
                    orthancBaseUrl: z.string(),
                    orthancProxyUrl: z.string().nullable().optional(),
            })
        })
    },[t]);

    type LinkStudiesFormData = z.infer<typeof linkStudiesFormSchema>

    const formProps = useForm<LinkStudiesFormData> ({
        mode: 'all',
        resolver: zodResolver(linkStudiesFormSchema)
    })

    const {
        control,
        handleSubmit,
        formState: {errors},
    } = formProps

    const fetchOptions = [
        { id: 'all', display: 'All' },
        { id: 'newest', display: 'Newest' },
      ];
    

    const onSubmit = useCallback(
        (data: LinkStudiesFormData) => {
            const {
                fetchOption,
                orthancConfiguration,
            } = data;

            const abortController = new AbortController();

            // copy the content because zod library makes everything optional
            const serverConfig: OrthancConfiguration = {
                id: orthancConfiguration.id,
                orthancBaseUrl: orthancConfiguration.orthancBaseUrl,
                orthancProxyUrl: orthancConfiguration.orthancProxyUrl,
            };
        
            getLinkStudies(fetchOption, serverConfig, abortController)
                .then((response) => {
                    closeWorkspace();
                    launchWorkspace(assignStudiesFormWorkspace, {configuration : serverConfig})
                    return () => abortController.abort();
                })
                .catch((err) => {
                    createErrorHandler();
                    showSnackbar({
                        title: t('linkStudiesError', 'Link studies error'),
                        kind: 'error',
                        isLowContrast: false,
                        subtitle: t('checkForConnection', 'Check connection')+": "+err?.message,
                    });
                })
                .finally(() => {
                    abortController.abort();
                    setIsLoading(false);
                })
            }, [closeWorkspace, t]);
        
    return (
        <FormProvider {...formProps}>
            {isLoading && <InlineLoading description={t('linkingStudies', 'Linking studies...')} />}
            <Form
                className={styles.formContainer} 
                onSubmit={handleSubmit(onSubmit)}
                id = "linkStudies"
            >
                {isTablet ? (
                    <Row className={styles.header}>
                        <ExtensionSlot className={styles.content} name="patient-details-header-slot" state={patientState} />
                    </Row>
                ) : null}
                <Stack gap={1} className={styles.formContent}>
                    <section>
                        <ResponsiveWrapper>
                            <FormGroup legendText={t('linkFetchOption', 'Fetch option for link studies')}>
                            <Controller
                                name="fetchOption"
                                control={control}
                                defaultValue={fetchOptions[0].id}
                                render={({ field: { value, onChange } }) => (
                                <RadioButtonGroup
                                    name="linkFetchOption"
                                    valueSelected={value}
                                    onChange={onChange}
                                >
                                    {fetchOptions.map(({ id, display }) => (
                                    <RadioButton
                                        key={id}
                                        id={id}
                                        labelText={display}
                                        value={id}
                                    />
                                    ))}
                                </RadioButtonGroup>
                                )}
                            />
                            </FormGroup>
                        </ResponsiveWrapper>
                    </section>
                    <section>
                        <ResponsiveWrapper>
                            <FormGroup legendText={t('orthancConfiguration', 'Orthanc configurations')}>
                                <Controller
                                name="orthancConfiguration"
                                control={control}
                                render={({field: {value, onChange}}) => (
                                    <ComboBox
                                        id="orthancConfiguration"
                                        itemToString={(item: OrthancConfiguration) => item?.orthancBaseUrl}
                                        items={orthancConfigurations.data || []}
                                        onChange={({ selectedItem }) => onChange(selectedItem)} 
                                        placeholder={t('selectOrthancServer', 'Select an Orthanc server')}
                                        selectedItem={value}
                                        invalid={!!errors.orthancConfiguration}
                                        invalidText={errors.orthancConfiguration?.message || t('selectValidServer', 'Please select a valid Orthanc server')}
                                    />
                                )}
                                />
                            </FormGroup>
                        </ResponsiveWrapper>
                    </section>
                    <ButtonSet
                        className={classNames(isTablet ? styles.tabletButtons : styles.desktopButtons)}>
                        <Button kind="primary" type="submit">
                            {t('fetchStudy', 'Fetch Study')}
                        </Button>
                        <Button kind="secondary" onClick={closeWorkspace}>
                            {t('cancel', 'Cancel')}
                        </Button>
                    </ButtonSet>
                </Stack>
            </Form>
        </FormProvider>
    );
}

export default LinkStudiesWorkspace;