import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OpenmrsDatePicker, ResponsiveWrapper, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
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
    SelectItem,
    InlineLoading
} from '@carbon/react'
import { DefaultPatientWorkspaceProps, type amPm } from '@openmrs/esm-patient-common-lib';
import { getProcedureStep, getRequestsByPatient, saveRequestProcedureStep} from '../../api';
import { FormProvider, useForm, Controller} from 'react-hook-form';
import { CreateRequestProcedureStep, modalityOptions, RequestProcedure } from '../../types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './worklist.scss';
import { toDICOMDateTime, toDicomTimeString } from '../utils/help';

export interface AddNewProcedureStepWorkspaceProps extends DefaultPatientWorkspaceProps{
  request: RequestProcedure;
}

const AddNewProcedureStepWorkspace: React.FC<AddNewProcedureStepWorkspaceProps> = ({
  patientUuid,
  request,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
    const { t } = useTranslation();
    const isTablet = useLayoutType() === 'tablet';
    const { mutate } = getProcedureStep(request.id);
    const { mutate: requestMutate} = getRequestsByPatient(patientUuid);

    const procedureStepFormSchema = useMemo(() => {
      return z.object({
        modality: z.string().min(1, { message: 'Modality is required' }),
        aetTitle: z.string().min(1, { message: 'AET title is required' }),
        scheduledReferringPhysician: z.string().refine((value) => !!value, {
          message: t('scheduledReferringPhysician', 'Referring physician is required'),
        }),
        requestedProcedureDescription: z.string().refine((value) => !!value, {
          message: t('requestedProcedureDescription', 'Procedure description is required'),
        }),
        stepStartDate: z.date().refine((value) => !!value, t('stepDateRequired', 'Step date is required')),
        stepStartTime: z.string().refine((value) => !!value, t('stepTimeRequired', 'Step start time is required')),
        timeFormat: z.string().refine((value) => !!value,  t('seletTimeFormat', 'Time format is required')),
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
      getValues,
      setValue,
      formState: {errors, isDirty, isSubmitting},
    } = formProps

    useEffect(() => {
      promptBeforeClosing(() => isDirty);
    }, [isDirty, promptBeforeClosing]);

    useEffect(() => {
      setValue('timeFormat', 'AM');
    }, [setValue]);

    useEffect(() => {
      setValue('modality', modalityOptions[0].code);
    }, [setValue]);


    const onSubmit = useCallback(
      async (data: NewProcedureStepFormData) => {
        const abortController = new AbortController();
        const time = getValues('stepStartTime');
        const format = getValues('timeFormat');
        const fullTime = toDicomTimeString(time, format as 'AM' | 'PM');

        // copy the content because zod library makes everything optional
        const requestId: number = request.id;
      
        const payload: CreateRequestProcedureStep = {
          requestId: requestId,
          modality: data.modality,
          aetTitle: data.aetTitle,
          scheduledReferringPhysician: data.scheduledReferringPhysician,
          requestedProcedureDescription: data.requestedProcedureDescription,
          stepStartDate: toDICOMDateTime(data.stepStartDate),
          stepStartTime: fullTime,
          stationName: data.stationName ? data.stationName: null,
          procedureStepLocation: data.procedureStepLocation ? data.procedureStepLocation : null
        }

        try{
          await saveRequestProcedureStep(payload, requestId, abortController)
          mutate();
          closeWorkspaceWithSavedChanges();
          showSnackbar({
            kind: 'success',
            title: t('requestSaved', 'Request saved successfully'),
          });
          requestMutate();
        }catch (err: any) {
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
          request,
          closeWorkspaceWithSavedChanges,
          t,
          mutate,
          requestMutate
        ],
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
                            itemToString={(item) => item?.label || ""}
                            items={modalityOptions}
                            onChange={({ selectedItem }) => onChange(selectedItem?.code)}
                            placeholder={t('selectModality', 'Select the modality')}
                            aria-label={t('modality', 'Modality')}
                            selectedItem={modalityOptions.find(opt => opt.code === value)}
                            invalid={!!errors?.modality}
                            invalidText={errors?.modality?.message || t('selectModality', 'Modality is required')}
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
                        invalidText={errors?.aetTitle?.message || t('enterAetTitle', 'AetTitle is required')}
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
                        invalidText={errors?.scheduledReferringPhysician?.message || t('enterScheduledReferringPhysician', 'Scheduled referring physician is required')}
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
                        invalidText={errors?.requestedProcedureDescription?.message || t('enterDescription', 'Description is required')}
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
                      invalid={!!errors?.stepStartTime}
                      invalidText={errors?.stepStartTime?.message || t('selectStepStartTime', 'Start time is required')}
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
                            invalid={!!errors?.timeFormat}
                            invalidText={errors?.timeFormat?.message || t('seletTimeFormat', 'Time format is required')}
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
                      />
                    </div>
                  )}
                />
              </ResponsiveWrapper>
            </section>
          </Stack>
            <ButtonSet className={isTablet ? styles.tabletButtons : styles.desktopButtons}>
              <Button className={styles.button} kind="secondary" onClick={closeWorkspace}>
                {t('discard', 'Discard')}
              </Button>
              <Button className={styles.button} kind="primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <InlineLoading description={t('saving', 'Saving') + '...'}/>
                  ) : t('saveAndClose', 'Save and Close')
                }
              </Button>
            </ButtonSet>
        </Form>
      </FormProvider>
    );
  }

export default AddNewProcedureStepWorkspace;