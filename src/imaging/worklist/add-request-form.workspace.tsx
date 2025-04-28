import React, { useCallback, useMemo, useEffect,} from 'react';
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
    FormGroup
} from '@carbon/react';
import { DefaultPatientWorkspaceProps } from '@openmrs/esm-patient-common-lib';
import styles from './worklist.scss';
import { OrthancConfiguration, RequestProcedure } from '../../types';
import { Controller, useForm, FormProvider} from 'react-hook-form';
import { saveRequestProcedure, getOrthancConfigurations } from '../../api';

function generateAccessionNumber(): string {
  const date: Date = new Date();

  const formattedDate: string =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');

  const randomPart: string = Math.floor(10000 + Math.random() * 90000).toString();

  const accessionNumber: string = formattedDate + randomPart;

  const inputElement = document.getElementById("accessionNumber") as HTMLInputElement | null;

  if (inputElement) {
      inputElement.value = accessionNumber;
  } else {
      console.warn('Element with ID "accessionNumber" not found.');
  }
  return accessionNumber;
}

const AddNewRequestWorkspace: React.FC<DefaultPatientWorkspaceProps> = ({
  patientUuid,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const orthancConfigurations = getOrthancConfigurations()

  const requestFormSchema = useMemo (() => {    
    return z.object({
        id: z.number(),
        status: z.string().nonempty({ message: t('statusError', 'Status is required') }),
        orthancConfiguration: z.object({
          id: z.number(),
          orthancBaseUrl: z.string(),
          orthancProxyUrl: z.string().nullable().optional(),
        }),
        patientUuid: z.string().nonempty({ message: 'Patient UID is required' }),
        accessionNumber: z.string().nonempty({ message: 'Accession number is required' }),
        studyInstanceUID: z.string().nullable().optional(),
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

  const priorityLevel = ['Low', 'Medium', 'High'];
  
  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  const onSubmit = useCallback(
    (data: NewRequestFormData) => {
      const {
        id,
        status,
        orthancConfiguration,
        patientUuid,
        accessionNumber,
        studyInstanceUID,
        requestingPhysician,
        requestDescription,
        priority, 
      } = data;
      const abortController = new AbortController();

      const newRequestProcedure: RequestProcedure = {
        id,
        status, 
        orthancConfiguration: {
          id: orthancConfiguration.id,
          orthancBaseUrl: orthancConfiguration.orthancBaseUrl,
          orthancProxyUrl: orthancConfiguration.orthancProxyUrl,
        },
        patientUuid,
        accessionNumber: accessionNumber,
        studyInstanceUID: studyInstanceUID,
        requestingPhysician: requestingPhysician,
        requestDescription: requestDescription,
        priority: priority
      };
    
      saveRequestProcedure(newRequestProcedure, patientUuid, abortController
      ).then(
       () => {
        closeWorkspaceWithSavedChanges();
        showSnackbar({
          kind: 'success',
          title: t('requestSaved', 'request saved successfully'),
          isLowContrast: true,
        });
       },
       (err) => {
        showSnackbar({
          title: t('errorSaving', 'Error saving request'),
          kind: 'error',
          isLowContrast: false,
          subtitle: err?.message,
        });
       }
      );
      return () => abortController.abort();
    },
    [
      patientUuid,
      closeWorkspaceWithSavedChanges,
      t
    ],
  );

  return (
    <FormProvider {...formProps}>
      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} id="newRequestForm">
        <Stack gap={1} className={styles.container}>
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
                defaultValue="Low"
                render={({field: {value, onChange}}) => (
                  <ComboBox
                    id="priority"
                    itemToString={(item: string) => item}
                    items={priorityLevel || []}
                    onChange = {({seletedItem}) => onChange(seletedItem)}
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
        <ButtonSet className={isTablet ? styles.tablet : styles.desktop}>
          <Button className={styles.button} kind="secondary" onClick={closeWorkspace}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button className={styles.button} kind="primary" disabled={isSubmitting} type="submit">
            {t('save', 'Save')}
          </Button>
        </ButtonSet>
      </Form>
    </FormProvider>
  );
}

export default AddNewRequestWorkspace;