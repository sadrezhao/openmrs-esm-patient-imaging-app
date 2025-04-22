import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OpenmrsDatePicker, ResponsiveWrapper, showSnackbar, toDateObjectStrict, toOmrsIsoString, useConfig, useLayoutType, useSession} from '@openmrs/esm-framework';
import {
    Button,
    ButtonSet,
    ComboBox,
    Form,
    FormGroup,
    Stack,
    TextArea,
    TextInput,
} from '@carbon/react'
import { DefaultPatientWorkspaceProps, type amPm, convertTime12to24} from '@openmrs/esm-patient-common-lib';
import { saveRequestProcedureStep, useOrthancConfigurations } from '../../api';
import { FormProvider, useForm, Controller} from 'react-hook-form';
import { modalityOptions, RequestProcedureStep } from '../../types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './worklist.scss';
import dayjs from 'dayjs';
import { TimePickerSelect } from '@carbon/react';
import { SelectItem } from '@carbon/react';
import { TimePicker } from '@carbon/react';

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
        id: z.number().optional(),
        requestProcedure: z.object({
          id: z.number().optional(),
          status: z.string(),
          orthancConfiguration: z
            .object({
              id: z.number().optional(),
              orthancBaseUrl: z.string(),
              orthancProxyUrl: z.string(),
              lastChangedIndex: z.number(),
            })
            .refine((val) => !!val.id, {
              message: t('selectConfigureUrlErrorMessage', 'Configured server is required'),
            }),
          patientUuid: z.string(),
          accessionNumber: z.string(),
          studyInstanceUID: z.string().optional(),
          requestingPhysician: z.string(),
          requestDescription: z.string(),
          priority: z.string(),
        }),
        modality: z.string().nonempty({ message: 'Modality is required' }),
        aetTitle: z.string().nonempty({ message: 'AET title is required' }),
        scheduledReferringPhysician: z.string().nonempty({ message: 'Referring physician is required' }),
        requestedProcedureDescription: z.string().nonempty({ message: 'Procedure description is required' }),
        stepStartDate: z.date().refine((value) => !!value, t('stepDateRequired', 'Step date required')),
        stepStartTime: z.string().refine((value) => !!value, t('stepTimeRequired', 'Step start time required')),
        timeFormat: z.enum(['PM', 'AM']),
        performedProcedureStepStatus: z.string().nonempty({ message: 'Procedure step status is required' }),
        stationName: z.string().optional(),
        procedureStepLocation: z.string().optional(),

      })
    }, [t]);

    type NewProcedureStepFormData = z.infer<typeof procedureStepFormSchema>;

    const formProps = useForm<NewProcedureStepFormData>({
      mode: 'all',
      resolver: zodResolver(procedureStepFormSchema),
      defaultValues:{
        id: undefined,
        requestProcedure: {

        },
        modality: 'CT (Computed Tomography)',
        aetTitle: '',
        scheduledReferringPhysician: '',
        requestedProcedureDescription: '',
        stepStartDate: new Date(),
        stepStartTime: dayjs(new Date()).format('hh:mm'),
        timeFormat: new Date().getHours() >= 12 ? 'PM' : 'AM',
        performedProcedureStepStatus: 'In progress',
        stationName: '',
        procedureStepLocation: '',
      },
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
          requestProcedure,
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

        const newRequestProcedureStep: RequestProcedureStep = {
          id,
          requestProcedure: {
            id: requestProcedure.id,
            status: requestProcedure.status,
            orthancConfiguration: {
              id: requestProcedure.orthancConfiguration.id,
              orthancBaseUrl: requestProcedure.orthancConfiguration.orthancBaseUrl,
              orthancProxyUrl: requestProcedure.orthancConfiguration.orthancProxyUrl,
              lastChangedIndex: requestProcedure.orthancConfiguration.lastChangedIndex
            },
            patientUuid: requestProcedure.patientUuid,
            accessionNumber: requestProcedure.accessionNumber,
            studyInstanceUID: requestProcedure.studyInstanceUID,
            requestingPhysician: requestProcedure.requestingPhysician,
            requestDescription: requestProcedure.requestDescription,
            priority: requestProcedure.priority
          },
          modality,
          aetTitle,
          scheduledReferringPhysician,
          requestedProcedureDescription,
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
          stepStartTime,
          performedProcedureStepStatus,
          stationName,
          procedureStepLocation
        };

        saveRequestProcedureStep(newRequestProcedureStep, patientUuid, abortController
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
                    render={({ field: { value, onChange } }) => (
                        <div className={styles.row}>
                          <ComboBox
                            id="modality"
                            itemToString={(item, index) => item || ''}
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