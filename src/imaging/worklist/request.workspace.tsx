import React, { useCallback, useMemo, useState, useEffect, ComponentProps, ChangeEvent} from 'react';
import { type TFunction, useTranslation } from 'react-i18next';
import { age, ConfigObject, createErrorHandler, ExtensionSlot, formatDate, getPatientName, parseDate, showSnackbar, useConfig, useLayoutType, useSession} from '@openmrs/esm-framework';
import { TypeOf, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    ButtonSet,
    ComboBox,
    Form,
    InlineNotification,
    Row,
    Grid,
    Column,
    FormLabel,
    Layer,
    TextArea,
    TextInput,
} from '@carbon/react';
import { DefaultPatientWorkspaceProps, usePatientChartStore } from '@openmrs/esm-patient-common-lib';
import styles from './worklist.scss';
import { OrthancConfiguration, RequestProcedure } from '../../types';
import { type Control, Controller, useForm, type UseFormSetValue, type UseFormGetValues, useController} from 'react-hook-form';
import { useOrthancConfigurations } from '../../api';
import classNames from 'classnames';
import { capitalize } from 'lodash-es';

export interface AddNewRequestWorkspaceProps extends DefaultPatientWorkspaceProps {
  patientUuid: string;
  initNewRequest: RequestProcedure;
  orthancConfigurations: Array<OrthancConfiguration>;
  onCancel: () => void;
  onSave: (finalizedRequest: RequestProcedure) => void;
  promptBeforeClosing: (testFcn: () => boolean) => void;
}

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

  // const inputElement = document.getElementById("accessionNumber") as HTMLInputElement | null;

  // if (inputElement) {
  //     inputElement.value = accessionNumber;
  // } else {
  //     console.warn('Element with ID "accessionNumber" not found.');
  // }
  return accessionNumber;
}

function useCreateRequestFormSchema() {
  const { t } = useTranslation();
  
  const schema = useMemo(() => {
    const baseSchemaFields = {
      status: z.string().nonempty({ message: 'Status is required' }),
      orthancConfiguration: z
      .object({
        id: z.number(),
        orthancBaseUrl: z.string(),
        orthancProxyUrl: z.string(),
        lastChangedIndex: z.number(),
      })
      .refine((val) => !!val.id, {
        message: t('selectConfigureUrlErrorMessage', 'Configured server is required'),
      }),
      patientUuid: z.string().nonempty({ message: 'Status is required' }),
      accessionNumber: z.string().nonempty({ message: 'Accession number is required' }),
      requestingPhysician: z.string().refine((value) => !!value, {
        message: t('requestingPhysicianMsg', 'Enter the requesting physician name'),
      }),
      requestDescription: z.string().refine((value) => !!value, {
        message: t('requestDescriptionMsg', 'Enter the request description'),
      }),
      priority: z.string()
      .min(1, { message: t('selectPriorityErrorMsg', 'Priority is required') }),
      studyInstanceUID: z.string().optional().or(z.literal('')),
    };
    return z.object(baseSchemaFields);
  }, [t]);

  return schema;
}

type NewRequestFormData = z.infer<ReturnType<typeof useCreateRequestFormSchema>>;

function InputWrapper({ children }) {
  const isTablet = useLayoutType() === 'tablet';
  return (
    <Layer level={isTablet ? 1 : 0}>
      <div className={styles.field}>{children}</div>
    </Layer>
  );
}
  
export default function AddNewRequestWorkspace({
    initNewRequest, onSave, onCancel, promptBeforeClosing, patientUuid} : AddNewRequestWorkspaceProps) {
    const { t } = useTranslation();
    const isTablet = useLayoutType() === 'tablet';
    const config = useConfig<ConfigObject>();
    const orthancConfigurations = useOrthancConfigurations()
    const { patient } = usePatientChartStore();
    const patientName = patient ? getPatientName(patient) : '';
    const newRequestFormSchema = useCreateRequestFormSchema();
    const patientState = useMemo(() => ({ patientUuid }), [patientUuid]);

  const { 
    control,
    formState: {isDirty},
    handleSubmit,
    getValues,
  } = useForm<NewRequestFormData>({
    mode: 'all',
    resolver: zodResolver(newRequestFormSchema),
    defaultValues: {
      status: initNewRequest.status,
      orthancConfiguration: initNewRequest.orthancConfiguration,
      patientUuid: initNewRequest.patientUuid,
      accessionNumber: initNewRequest.accessionNumber,
      studyInstanceUID: initNewRequest.studyInstanceUID,
      requestingPhysician: initNewRequest.requestingPhysician,
      requestDescription: initNewRequest.requestDescription,
      priority: initNewRequest.priority,
    }
  })

  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  const handleFormSubmission = (data: NewRequestFormData) => {
    const newRequest = {
      ... initNewRequest,
      status: data.status,
      orthancConfigurations: data.orthancConfiguration,
      patientUuid: data.patientUuid,
      accessionNumber: data.accessionNumber,
      studyInstanceUID: data.studyInstanceUID,
      requestingPhysician: data.requestingPhysician,
      requestDescription: data.requestDescription,
      priority: data.priority
    };
    onSave(newRequest as RequestProcedure)
  };

  // const filterItemsByName = useCallback((menu) => {
  //   return menu?.item?.value?.toLowerCase().includes(menu?.inputValue?.toLowerCase());
  // }, []);
    
  return (
    <div className={styles.container}>
      {isTablet && (
        <div className={styles.patientHeader}>
          <span className={styles.bodyShort02}>{patientName}</span>
          <span className={classNames(styles.text02, styles.bodyShort01)}>
            {capitalize(patient?.gender)} &middot; {age(patient?.birthDate)} &middot;{' '}
            <span>{formatDate(parseDate(patient?.birthDate), { mode: 'wide', time: false })}</span>
          </span>
        </div>
      )}
      <Form
          className={styles.formContainer}
          onSubmit={handleSubmit(handleFormSubmission)}
          id="newRequestForm"
        >
         <div>
         {orthancConfigurations.error && (
            <InlineNotification
              kind="error"
              lowContrast
              className={styles.inlineNotification}
              title={t('errorFetchingServerConfig', 'Error occured when fetching server config')}
              subtitle={t('tryReopeningTheForm', 'Please try launching the form again')}
            />
          )}
         {isTablet ? (
           <Row className={styles.header}>
             <ExtensionSlot className={styles.content} name="patient-details-header-slot" state={patientState} />
           </Row>
         ) : null}
          <div className="form-container-wrapper">
          <h2 style={{ color: '#009384' }}>{t('Create request')}</h2>
          <Grid condensed>
              <Column sm={4} md={8} lg={16}>
                <ControlledFieldInput
                  name="accessionNumber"
                  control={control}
                  type="textInput"
                  labelText={t('accessionNumber', 'AccessionNumber')}
                  placeholder={t('enterAccessionNumber', 'Enter accession number')}
                  maxLength={150}
                  helperText={
                    <Button kind="ghost" size="sm" onClick={generateAccessionNumber}>Generate</Button>
                  }
                />
            </Column>
            <Column lg={16} md={4} sm={4}>
              <InputWrapper>
                <ControlledFieldInput
                  control={control}
                  name="orthancConfig"
                  type="comboBox"
                  getValues={getValues}
                  id="orthancConfig"
                  // shouldFilterItem={filterItemsByName}
                  placeholder={"Select an Orthanc server"}
                  titleText={"Configured server"}
                  items={orthancConfigurations}
                  itemToString={(item: OrthancConfiguration) => item?.orthancBaseUrl}
                />
              </InputWrapper>
            </Column>
            <Column lg={16} md={6} sm={4}>
              <InputWrapper>
                <ControlledFieldInput
                  control={control}
                  name="requestingPhysician"
                  type="textInput"
                  id="requestingPhysician"
                  labelText={t('requestingPhysician', 'requestingPhysician')}
                  placeholder={t('requestingPhysician', 'requestingPhysician')}
                  maxLength={150}
                />
              </InputWrapper>
            </Column>
            <Column lg={16} md={6} sm={4}>
              <InputWrapper>
                <ControlledFieldInput
                  control={control}
                  name="requestDescription"
                  type="textInput"
                  id="requestDescription"
                  labelText={t('requestDescription', 'requestDescription')}
                  placeholder={t('requestDescription', 'requestDescription')}
                  maxLength={255}
                />
              </InputWrapper>
            </Column>
          </Grid>
        </div>
      </div>
      <ButtonSet
          className={classNames(styles.buttonSet, isTablet ? styles.tabletButtonSet : styles.desktopButtonSet)}
        >
          <Button className={styles.button} kind="secondary" onClick={onCancel} size="xl">
            {t('discard', 'Discard')}
          </Button>
          <Button
            className={styles.button}
            kind="primary"
            type="submit"
            size="xl"
            disabled={!!orthancConfigurations.error}
          >
            {t('saveOrder', 'Save order')}
          </Button>
        </ButtonSet>
      </Form>
    </div>
  );
}

type NewRequestFormValue = NewRequestFormData[keyof NewRequestFormData];

interface BaseControlledFieldInputProps {
  name: keyof NewRequestFormData;
  type: 'number' | 'textArea' | 'textInput' | 'comboBox';
  handleAfterChange?: (newValue: NewRequestFormValue, prevValue: NewRequestFormValue) => void;
  control: Control<NewRequestFormData>;
  getValues?: (name: keyof NewRequestFormData) => NewRequestFormValue;
}

type ControlledFieldInputProps = Omit<BaseControlledFieldInputProps, 'type'> &
  (
    | ({ type: 'textArea' } & ComponentProps<typeof TextArea>)
    | ({ type: 'textInput' } & ComponentProps<typeof TextInput>)
    | ({ type: 'comboBox' } & ComponentProps<typeof ComboBox>)
  );

const ControlledFieldInput = ({
  name,
  type,
  control,
  getValues,
  handleAfterChange,
  ...restProps
}: ControlledFieldInputProps) => {
  const {
    field: { onBlur, onChange, value, ref },
    fieldState: { error },
  } = useController<NewRequestFormData>({ name: name, control });
  const isTablet = useLayoutType() === 'tablet';
  const responsiveSize = isTablet ? 'lg' : 'sm';

  const fieldErrorStyles = classNames({
    [styles.fieldError]: error?.message,
  })

  const handleChange = useCallback(
    (newValue: NewRequestFormValue) => {
      const prevValue = getValues?.(name);
      onChange(newValue);
      handleAfterChange?.(newValue, prevValue);
    },
    [getValues, onChange, handleAfterChange, name],
  );

  const component = useMemo(() => {
    if (type === 'textArea') {
      return (
        <TextArea
          className={fieldErrorStyles}
          onBlur={onBlur}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.value)}
          ref={ref}
          size={responsiveSize}
          value={value}
          {...restProps}
        />
      );
    }

    if (type === 'textInput') {
      return (
        <TextInput
          className={fieldErrorStyles}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
          onBlur={onBlur}
          ref={ref}
          size={responsiveSize}
          value={value}
          {...restProps}
        />
      );
    }

    if (type === 'comboBox') {
      return (
        <ComboBox
          className={fieldErrorStyles}
          onBlur={onBlur}
          onChange={({ selectedItem }) => handleChange(selectedItem)}
          ref={ref}
          size={responsiveSize}
          selectedItem={value}
          {...restProps}
        />
      );
    }

    return null;
  }, [type, value, restProps, handleChange, fieldErrorStyles, onBlur, ref, responsiveSize]);

  return (
    <>
      {component}
      <FormLabel className={styles.errorLabel}>{error?.message}</FormLabel>
    </>
  );
}