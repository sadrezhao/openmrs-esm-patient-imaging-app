import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createErrorHandler, ExtensionSlot, showSnackbar, useConfig, useLayoutType, useSession} from '@openmrs/esm-framework';
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
import { DefaultPatientWorkspaceProps } from '@openmrs/esm-patient-common-lib';
import styles from './worklist.scss';

export interface AddNewProcedureStepWorkspaceProps extends DefaultPatientWorkspaceProps{
  patient: fhir.Patient;
  patientUuid: string;
}

export default function AddNewProcedureStepWorkspace (props: AddNewProcedureStepWorkspaceProps) {
    const { t } = useTranslation();
    const isTablet = useLayoutType() === 'tablet';
    const { closeWorkspace, patientUuid, } = props;
    const patientState = useMemo(() => ({ patientUuid }), [patientUuid]);

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
        
    },[t, closeWorkspace]);

    return (
        <Form
            className={styles.formContainer}
            onSubmit={handleSubmit}
        >
         {isTablet ? (
           <Row className={styles.header}>
             <ExtensionSlot className={styles.content} name="patient-details-header-slot" state={patientState} />
           </Row>
         ) : null}
         <div className={styles.form}>
            <Stack gap={5} className={styles.formContent}>
                <div>Add new procedure step</div>
            </Stack>
         </div>
        </Form>
    );
}
