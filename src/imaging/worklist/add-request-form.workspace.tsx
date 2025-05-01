import React, { useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveWrapper, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    ButtonSet,
    ComboBox,
    Form,
    TextArea,
    TextInput,
    Stack,
    FormGroup,
    InlineLoading
} from '@carbon/react';
import { DefaultPatientWorkspaceProps } from '@openmrs/esm-patient-common-lib';
import { CreateRequestProcedure, OrthancConfiguration, priorityLevels} from '../../types';
import { Controller, useForm, FormProvider} from 'react-hook-form';
import { saveRequestProcedure, getOrthancConfigurations, getStudiesByPatient, getRequestsByPatient } from '../../api';
import { generateAccessionNumber } from '../utils/help';
import styles from './worklist.scss';

const AddNewRequestWorkspace: React.FC<DefaultPatientWorkspaceProps> = ({
  patientUuid,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const orthancConfigurations = getOrthancConfigurations()
  const { mutate } = getRequestsByPatient(patientUuid)

  const requestFormSchema = useMemo (() => {    
    return z.object({
        id: z.number().nullable().optional(),
        orthancConfiguration: z.object({
          id: z.number(),
          orthancBaseUrl: z.string(),
          orthancProxyUrl: z.string().nullable().optional(),
        }),
        accessionNumber: z.string().nonempty({ message: 'Accession number is required' }),
        requestingPhysician: z.string().refine((value) => !!value, {
          message: t('requestingPhysicianMsg', 'Enter the requesting physician name'),
        }),
        requestDescription: z.string().refine((value) => !!value, {
          message: t('requestDescriptionMsg', 'Enter the request description'),
        }),
        priority: z.string().min(1, { message: 'Priority is required'}),
      });
    }, [t]);

  type NewRequestFormData = z.infer<typeof requestFormSchema>;

  const formProps = useForm<NewRequestFormData>({
    mode: 'all',
    resolver: zodResolver(requestFormSchema),
  });

  const {
    control,
    handleSubmit,
    formState: {errors, isDirty, isSubmitting},
  } = formProps
  
  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  const onSubmit = useCallback(
     async (data: NewRequestFormData) => {
      const abortController = new AbortController();

      const payload: CreateRequestProcedure = {
        orthancConfiguration: {
          id: data.orthancConfiguration.id,
          orthancBaseUrl: data.orthancConfiguration.orthancBaseUrl,
          orthancProxyUrl: data.orthancConfiguration.orthancProxyUrl,
        },
        patientUuid: patientUuid,
        accessionNumber: data.accessionNumber,
        requestingPhysician: data.requestingPhysician,
        requestDescription: data.requestDescription,
        priority: data.priority,
      };

      try{  
        await saveRequestProcedure(payload, patientUuid, abortController)
        mutate();
        closeWorkspaceWithSavedChanges();
        showSnackbar({
          kind: 'success',
          title: t('requestSaved', 'Request saved successfully'),
        });
      } catch (err: any) {
        showSnackbar({
          title: t('errorSaving', 'Error saving request'),
          kind: 'error',
          subtitle: err?.message,
          isLowContrast: false,
        });
      }
    },
    [
      patientUuid,
      closeWorkspaceWithSavedChanges,
      t
    ],
  );

  return (
    <FormProvider {...formProps}>
      <Form className={styles.form} id="newRequestForm" onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={1} className={styles.container}
        >
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
          <section>
            <ResponsiveWrapper>
              <Controller
                name="accessionNumber"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className={'div'} style={{display: 'flex'}}>
                    <TextInput
                      type="text"
                      id="accessionNumber"
                      labelText={t('accessionNumber', 'accessionNumber')}
                      value={value}
                      onChange={(evt) => onChange(evt.target.value)}
                      invalid={!!errors.accessionNumber}
                      invalidText={errors.accessionNumber?.message || t('enterAccessionNumber', 'Please enter the accession number')}
                    />
                     <Button
                        type="button"
                        onClick={() => onChange(generateAccessionNumber())}
                        style={{width: '15px'}}
                      >
                      Generate number
                      </Button>
                  </div>
                )}
              />
            </ResponsiveWrapper>
          </section>
          <section>
            <ResponsiveWrapper>
              <Controller
                name="requestingPhysician"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className={styles.row}>
                    <TextInput
                      type="text"
                      id="requestingPhysician"
                      labelText={t('requestingPhysician', 'requestingPhysician')}
                      value={value}
                      onChange={(evt) => onChange(evt.target.value)}
                      invalid={!!errors.requestingPhysician}
                      invalidText={errors.requestingPhysician?.message || t('enterRequestingPhysician', 'Please enter the physician')}
                    />
                  </div>
                )}
              />
            </ResponsiveWrapper>
          </section>
          <section>
            <ResponsiveWrapper>
              <Controller
                name="requestDescription"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className={styles.row}>
                    <TextArea
                      type="text"
                      id="requestDescription"
                      labelText={t('requestDescription', 'Request description')}
                      value={value}
                      onChange={(evt) => onChange(evt.target.value)}
                      invalid={!!errors?.requestDescription}
                      invalidText={errors?.requestDescription?.message || t('enterRequestDescription', 'Please enter the request description')}
                    />
                  </div>
                )}
              />
            </ResponsiveWrapper>
          </section>
          <section>
            <ResponsiveWrapper>
              <FormGroup legendText={t('priority', 'priority')}>
              <Controller
                name="priority"
                control={control}
                defaultValue="low"
                render={({field: {value, onChange}}) => (
                  <ComboBox
                    id="priority"
                    itemToString={(item: string) => item}
                    items={priorityLevels}
                    onChange={({ selectedItem }) => onChange(selectedItem)}
                    placeholder={t('selectPriority', 'Select the request priority')}
                    selectedItem={value}
                    invalid={!!errors.priority}
                    invalidText={errors.priority?.message || t('selectPriority', 'Please enter the priority')}
                  />
                )}
              />
              </FormGroup>
            </ResponsiveWrapper>
          </section>
        </Stack>
        <ButtonSet className={isTablet ? styles.tabletButtons : styles.desktopButtons}>
          <Button className={styles.button} onClick={closeWorkspace} kind="secondary">
            {t('discard', 'Discard')}
          </Button>       
          <Button className={styles.button} kind="primary" 
            disabled={isSubmitting} type="submit"
          >      
            {isSubmitting ? (
                <InlineLoading description={t('saving', 'Saving') + '...'}/>
                ) : t('saveAndClose', 'Save and Close')}
          </Button>
        </ButtonSet>
      </Form>
    </FormProvider>
  );
}

export default AddNewRequestWorkspace;