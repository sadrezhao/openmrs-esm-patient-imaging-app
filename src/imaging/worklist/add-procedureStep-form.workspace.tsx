import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigObject, createErrorHandler, ExtensionSlot, showSnackbar, useConfig, useLayoutType, useSession} from '@openmrs/esm-framework';
import {
    Button,
    ButtonSet,
    Checkbox,
    ComboBox,
    Form,
    FormGroup,
    InlineLoading,
    InlineNotification,
    RadioButton,
    RadioButtonGroup,
    Row,
    Stack,
    TextArea,
    TextInput,
} from '@carbon/react'
import { DefaultPatientWorkspaceProps, usePatientChartStore } from '@openmrs/esm-patient-common-lib';
import { saveRequestProcedureStep, useOrthancConfigurations } from '../../api';
import { FormProvider, useForm } from 'react-hook-form';
import { RequestProcedureStep } from '../../types';
import { BehaviorSubject } from 'rxjs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './worklist.scss';
import dayjs from 'dayjs';

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
    const config = useConfig<ConfigObject>();
    const orthancConfigurations = useOrthancConfigurations()
    const { patient } = usePatientChartStore();
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
        modality: z.string(),
        aetTitle: z.string(),
        scheduledReferringPhysician: z.string(),
        requestedProcedureDescription: z.string(),
        stepStartDate: z.string().refine((value) => !!value, t('stepDateRequired', 'Procedure date required')),
        stepStartTime: z.string(),
        performedProcedureStepStatus: z.string(),
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
        modality: 'CT',
        aetTitle: '',
        scheduledReferringPhysician: '',
        requestedProcedureDescription: '',
        stepStartDate: (new Date()).toDateString(),
        stepStartTime: dayjs(new Date()).format('hh:mm'),
        performedProcedureStepStatus: 'In progress',
        stationName: '',
        procedureStepLocation: '',
      },
    });

    const {
      control,
      handleSubmit,
      reset,
      formState: {errors, isDirty, isSubmitting},
      watch,
      setValue,
    } = formProps

    useEffect(() => {
      promptBeforeClosing(() => isDirty);
    }, [isDirty, promptBeforeClosing]);

    const procedureStepSub = new BehaviorSubject<RequestProcedureStep | null>(null);

    useEffect(() => {
      const sub = procedureStepSub.subscribe((props) => {
        if(props) {
          reset({
            id: props.id,
            requestProcedure: props.requestProcedure,
            modality: props.modality,
            aetTitle: props.aetTitle,
            scheduledReferringPhysician: props.scheduledReferringPhysician,
            requestedProcedureDescription: props.requestedProcedureDescription,
            stepStartDate: props.stepStartDate,
            stepStartTime: props.stepStartTime,
            performedProcedureStepStatus: props.performedProcedureStepStatus,
            stationName: props.stationName,
            procedureStepLocation: props.procedureStepLocation
          })
        }
      });
      return () => {
        sub.unsubscribe();
        procedureStepSub.next(null);
      }
    }, [reset])

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
          performedProcedureStepStatus,
          stationName,
          procedureStepLocation
        } = data;
        const abortController = new AbortController();

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
          stepStartDate,
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
        },
      [
        currentUser?.sessionLocation?.uuid,
        patientUuid,
        currentUser?.currentProvider?.uuid,
        closeWorkspaceWithSavedChanges,
        t
      ],
    );
    return(
      <FormProvider {...formProps}>
        <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} id="newRequestStepForm">
          <Stack gap={1} className={styles.container}>
            <div>Here is the procedure step form</div>
          </Stack>
        </Form>
      </FormProvider>
    )
  }

export default AddNewProcedureStepWorkspace;