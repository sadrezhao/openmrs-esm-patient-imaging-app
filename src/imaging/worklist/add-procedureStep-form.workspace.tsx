import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OpenmrsDatePicker, ResponsiveWrapper, showSnackbar, toDateObjectStrict, toOmrsIsoString, useLayoutType, useSession} from '@openmrs/esm-framework';
import {
    Button,
    ButtonSet,
    ComboBox,
    Form,
    FormGroup,
    Stack,
    TextArea,
    TextInput,
    TimePicker,
    TimePickerSelect,
    SelectItem
} from '@carbon/react'
import { DefaultPatientWorkspaceProps, type amPm, convertTime12to24} from '@openmrs/esm-patient-common-lib';
import { saveRequestProcedureStep, getOrthancConfigurations } from '../../api';
import { FormProvider, useForm, Controller} from 'react-hook-form';
import { modalityOptions, RequestProcedureStep } from '../../types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './worklist.scss';
import dayjs from 'dayjs';
import { testRequestProcedure } from '../../api/api-test';

export interface AddNewProcedureStepWorkspaceProps extends DefaultPatientWorkspaceProps{
  patient: fhir.Patient;
  patientUuid: string;
}

const AddNewProcedureStepWorkspace: React.FC<AddNewProcedureStepWorkspaceProps> = ({
  patientUuid,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
    const { t } = useTranslation();
    const isTablet = useLayoutType() === 'tablet';
    const currentUser = useSession();

    const procedureStepFormSchema = useMemo(() => {
      return z.object({
        id: z.number(),
        requestId: z.number(),
        // requestProcedure: z.object({
        //   id: z.number(),
        //   status: z.string().nonempty({ message: t('statusError', 'Status is required') }),
        //   orthancConfiguration: z.object({
        //     id: z.number(),
        //     orthancBaseUrl: z.string(),
        //     orthancProxyUrl: z.string().nullable().optional(),
        //     lastChangedIndex: z.number(),
        //   }),
        //   patientUuid: z.string().nonempty({ message: 'Patient UID is required' }),
        //   accessionNumber: z.string().nonempty({ message: 'Accession number is required' }),
        //   studyInstanceUID: z.string().nullable().optional(),
        //   requestingPhysician: z.string().refine((value) => !!value, {
        //     message: t('requestingPhysicianMsg', 'Enter the requesting physician name'),
        //   }),
        //   requestDescription: z.string().refine((value) => !!value, {
        //     message: t('requestDescriptionMsg', 'Enter the request description'),
        //   }),
        //   priority: z.string().min(1, { message: 'Priority is required'}),   
        // }).required(),
        modality: z.string().min(1, { message: 'Modality is required' }),
        aetTitle: z.string().min(1, { message: 'AET title is required' }),
        scheduledReferringPhysician: z.string().refine((value) => !!value, {
          message: t('scheduledReferringPhysician', 'Referring physician is required'),
        }),
        requestedProcedureDescription: z.string().refine((value) => !!value, {
          message: t('requestedProcedureDescription', 'Procedure description is required'),
        }),
        stepStartDate: z.date().refine((value) => !!value, t('stepDateRequired', 'Step date required')),
        stepStartTime: z.string().refine((value) => !!value, t('stepTimeRequired', 'Step start time required')),
        timeFormat: z.enum(['PM', 'AM']),
        performedProcedureStepStatus: z.string().min(1, { message: 'Procedure step status is required' }),
        stationName: z.string().nullable().optional(),
        procedureStepLocation: z.string().nullable().optional(),
      });
    }, [t]);

    type NewProcedureStepFormData = z.infer<typeof procedureStepFormSchema>;

    const formProps = useForm<NewProcedureStepFormData>({
      mode: 'all',
      resolver: zodResolver(procedureStepFormSchema),
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
      (data: NewProcedureStepFormData) => {
        const {
          id,
          // requestProcedure,
          requestId,
          modality,
          aetTitle,
          scheduledReferringPhysician,
          requestedProcedureDescription,
          stepStartDate,
          stepStartTime,
          timeFormat,
          performedProcedureStepStatus,
          stationName,
          procedureStepLocation,
        } = data;

        const abortController = new AbortController();
        const [hours, minutes] = convertTime12to24(stepStartTime, timeFormat);

        // copy the content because zod library makes everything optional
        const newRequestProcedureStep: RequestProcedureStep = {
          id,
          requestId: requestId,
          // requestProcedure: {
          //   id: requestProcedure.id,
          //   status: requestProcedure.status,
          //   orthancConfiguration: {
          //     id: requestProcedure.orthancConfiguration.id,
          //     orthancBaseUrl: requestProcedure.orthancConfiguration.orthancBaseUrl,
          //     orthancProxyUrl: requestProcedure.orthancConfiguration.orthancProxyUrl,
          //     lastChangedIndex: requestProcedure.orthancConfiguration.lastChangedIndex
          //   },
          //   patientUuid: requestProcedure.patientUuid,
          //   accessionNumber: requestProcedure.accessionNumber,
          //   studyInstanceUID: requestProcedure.studyInstanceUID,
          //   requestingPhysician: requestProcedure.requestingPhysician,
          //   requestDescription: requestProcedure.requestDescription,
          //   priority: requestProcedure.priority,
          // },
          modality: modality,
          aetTitle: aetTitle,
          scheduledReferringPhysician: scheduledReferringPhysician,
          requestedProcedureDescription: requestedProcedureDescription,
          stepStartDate: toDateObjectStrict(
            toOmrsIsoString(
              new Date(
                dayjs(stepStartDate).year(),
                dayjs(stepStartDate).month(),
                dayjs(stepStartDate).date(),
                hours,
                minutes,
              ),
            ),
          ),
          stepStartTime: stepStartTime,
          performedProcedureStepStatus: performedProcedureStepStatus,
          stationName: stationName,
          procedureStepLocation: procedureStepLocation
        };

        saveRequestProcedureStep(newRequestProcedureStep, requestId, abortController
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

        },[currentUser, patientUuid, closeWorkspaceWithSavedChanges, t]
    );

    return(
      <FormProvider {...formProps}>
        <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} id="newRequestStepForm">
          <Stack gap={1} className={styles.container}>
            <section>
              <ResponsiveWrapper>
                <FormGroup legendText={t('modality', 'Modality')}>
                  <Controller
                    name="modality"
                    control={control}
                    defaultValue={modalityOptions[0]}
                    render={({ field: { value, onChange } }) => (
                        <div className={styles.row}>
                          <ComboBox
                            id="modality"
                            itemToString={(item) => item || ''}
                            items={modalityOptions}
                            onChange={({ selectedItem }) => onChange(selectedItem)}
                            placeholder={t('selectModality', 'Select the modality')}
                            selectedItem={value}
                            invalid={!!errors?.modality}
                            invalidText={errors?.modality?.message || t('selectModality', 'Please select a modality')}
                          />
                        </div>
                      )
                    }
                  />
                </FormGroup>
              </ResponsiveWrapper>
            </section>
            <section>
              <ResponsiveWrapper>
                <Controller
                  name="aetTitle"
                  control={control}
                  render={({ field: { onChange, value }}) => (
                    <div className={styles.row}>
                      <TextInput
                        type="text"
                        id="aetTitle"
                        labelText={t('aetTitle', 'AetTitle')}
                        value={value}
                        onChange={(evt) => onChange(evt.target.value)}
                        invalid={!!errors?.aetTitle}
                        invalidText={errors?.aetTitle?.message || t('enterAetTitle', 'Please enter the aetTitle')}
                      />
                    </div>
                  )}
                />
              </ResponsiveWrapper>
            </section>
            <section>
              <ResponsiveWrapper>
                <Controller
                  name="scheduledReferringPhysician"
                  control={control}
                  render={({field: {onChange, value}}) => (
                    <div className={styles.row}>
                      <TextInput
                        type="text"
                        id="scheduledReferringPhysician"
                        labelText={t('scheduledReferringPhysician', 'scheduledReferringPhysician')}
                        value={value}
                        onChange={(evt) => onChange(evt.target.value)}
                        invalid={!!errors?.scheduledReferringPhysician}
                        invalidText={errors?.scheduledReferringPhysician?.message || t('enterScheduledReferringPhysician', 'Please enter the scheduled referring physician')}
                      />
                    </div>
                  )}
                />
              </ResponsiveWrapper>
            </section>
            <section>
              <ResponsiveWrapper>
                <Controller
                  name="requestedProcedureDescription"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <div className={styles.row}>
                      <TextArea
                        type="text"
                        id="requestedProcedureDescription"
                        labelText={t('description', 'Description')}
                        value={value}
                        onChange={(evt) => onChange(evt.target.value)}
                        invalid={!!errors?.requestedProcedureDescription}
                        invalidText={errors?.requestedProcedureDescription?.message || t('enterRequestedProcedureDescription', 'EnterRequestedProcedureDescription')}
                      />
                    </div>
                  )}
                />
              </ResponsiveWrapper>
            </section>
            <section>
              <ResponsiveWrapper>
                <Controller
                  name="stepStartDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <OpenmrsDatePicker
                      {...field}
                      id="stepStartDate"
                      data-testid="stepStartDate"
                      maxDate={new Date()}
                      style={{ paddingBottom: '1rem', width: '100%' }}
                      labelText={t('stepStartDate', 'StepStartDate')}
                      invalid={Boolean(fieldState?.error?.message)}
                      invalidText={fieldState?.error?.message}
                    />
                  )}
                />
              </ResponsiveWrapper>
            </section>
            <section>
            <ResponsiveWrapper>
                <Controller
                  name="stepStartTime"
                  control={control}
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TimePicker
                      id="stepStartTime"
                      labelText={t('time', 'Time')}
                      onChange={(event) => onChange(event.target.value as amPm)}
                      pattern="^(1[0-2]|0?[1-9]):([0-5]?[0-9])$"
                      style={{ marginLeft: '0.125rem', flex: 'none' }}
                      value={value}
                      onBlur={onBlur}
                    >
                      <Controller
                        name="timeFormat"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <TimePickerSelect
                            id="timeFormatSelect"
                            onChange={(event) => onChange(event.target.value as amPm)}
                            value={value}
                            aria-label={t('timeFormat ', 'Time Format')}
                          >
                            <SelectItem value="AM" text={t('AM', 'AM')} />
                            <SelectItem value="PM" text={t('PM', 'PM')} />
                          </TimePickerSelect>
                        )}
                      />
                    </TimePicker>
                  )}
                />
              </ResponsiveWrapper>
            </section>
            <section>
              <ResponsiveWrapper>
                <Controller
                  name="stationName"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <div className={styles.row}>
                      <TextInput
                        type="text"
                        id="stationName"
                        labelText={t('stationName', 'stationName')}
                        value={value}
                        onChange={(evt) => onChange(evt.target.value)}
                        invalid={!!errors?.stationName}
                        invalidText={errors?.stationName?.message || t('enterStationName', 'Please enter the station name')}
                      />
                    </div>
                  )}
                />
              </ResponsiveWrapper>
            </section>
            <section>
              <ResponsiveWrapper>
                <Controller
                  name="procedureStepLocation"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <div className={styles.row}>
                      <TextInput
                        type="text"
                        id="procedureStepLocation"
                        labelText={t('procedureStepLocation', 'procedureStepLocation')}
                        value={value}
                        onChange={(evt) => onChange(evt.target.value)}
                        invalid={!!errors?.procedureStepLocation}
                        invalidText={errors?.procedureStepLocation?.message || t('enterProcedureStepLocation', 'Please enter the procedure step location')}
                      />
                    </div>
                  )}
                />
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

export default AddNewProcedureStepWorkspace;