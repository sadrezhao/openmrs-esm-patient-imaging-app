import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createErrorHandler, ExtensionSlot, showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import { launchPatientWorkspace, type DefaultPatientWorkspaceProps } from '@openmrs/esm-patient-common-lib';
import { uploadFiles, useOrthancConfigurations } from '../../api';
import {
  Button,
  ComboBox,
  Form,
  Stack,
  Row
} from '@carbon/react';
import { OrthancConfiguration } from '../../types';
import { FileUploader } from '@carbon/react';
import styles from './studies.scss'
import { maxUploadImageDataSize } from '../constants';

export interface UploadStudiesWorkspaceProps extends DefaultPatientWorkspaceProps {
  patient: fhir.Patient;
}

export default function UploadStudiesWorkspace(props: UploadStudiesWorkspaceProps) {

  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const [selectedServer, setSelectedServer] = useState<OrthancConfiguration | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const orthancConfigurations  = useOrthancConfigurations();
  const { closeWorkspace, patientUuid, } = props;
  const patientState = useMemo(() => ({ patientUuid }), [patientUuid]);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedServer) {
      closeWorkspace({ignoreChanges: true});
      showSnackbar({
        title: "Upload stuies error",
        subtitle: "Select only one server",
        kind: 'error',
        isLowContrast: false,
      });
      return;
    }

    if (selectedFiles.length === 0) {
      closeWorkspace({ignoreChanges: true})
      showSnackbar({
        title: "Upload stuies error",
        subtitle: "Select files to upload",
        kind: 'error',
        isLowContrast: false,
      });
      return;
    }

    const oversized = selectedFiles.some(file => file.size > maxUploadImageDataSize);
    if (oversized) {
      closeWorkspace({ignoreChanges: true});
      showSnackbar({
        title: "Upload stuies error",
        subtitle: 'One or more files exceed the size limit of 2MB.',
        kind: 'error',
        isLowContrast: false,
      });
      return;
    }

    const formData = new FormData();
      formData.append('orthancBaseUrl', selectedServer.orthancBaseUrl);
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

    console.log('Uploading studies', formData);
    const abortController = new AbortController();

    uploadFiles(selectedFiles, selectedServer, abortController)
      .then((response) => {
        closeWorkspace({ignoreChanges: true});
        if (response.status === 201 || response.status === 200) {
            showSnackbar({
              isLowContrast: true,
              kind: 'success',
              title: t('studyUploaded', 'StudyUploaded'),
              subtitle: t(
                'studyReadyToSynchronize', 'StudyReadyToSynchronize',
              ),
            });
        }
      })
      .catch(() => {
        createErrorHandler();
        showSnackbar({
          title: t('uploadStudiesError', 'UploadStudiesError'),
          kind: 'error',
          isLowContrast: false,
          subtitle: t('checkForUpload', 'CheckForUpload'),
        });
      })
    .finally(()=> abortController.abort);
    closeWorkspace;
  }, [selectedFiles, selectedServer, t, closeWorkspace ]);

  return (
    <Form
      className={styles.formContainer}
      encType="multipart/form-data"
      onSubmit={handleSubmit}
    > 
      {isTablet ? (
        <Row className={styles.header}>
          <ExtensionSlot className={styles.content} name="patient-details-header-slot" state={patientState} />
        </Row>
      ) : null}
      <div className={styles.form}>
        <Stack gap={5} className={styles.formContent}>
          <ComboBox
            id="orthancConfigurationId"
            items={(orthancConfigurations && orthancConfigurations.data) ?? []}
            itemToString={(item: OrthancConfiguration) => item?.orthancBaseUrl || ''}
            titleText={t('selectOrthancServer', 'SelectOrthancServer')}
            onChange={({ selectedItem }) => setSelectedServer(selectedItem)}
            placeholder={t('selectOrthancServer', 'SelectOrthancServer')}
          />

          <FileUploader
            labelTitle={t(
              'selectFilesToUpload',
              `Select files to upload (dicom or zip). Max size: ${maxUploadImageDataSize / 2000000} MB`
            )}
            name="files"
            buttonLabel={t('chooseFiles', 'Choose Files')}
            multiple
            accept={['.dcm', '.zip']}
            onChange={(e: any) => {
              const files = Array.from(e.target.files ?? []);
              setSelectedFiles(selectedFiles);
            }}
          />
          <div className={styles['popup-box-btn']}>
            <Button type="submit" kind="primary">
              {t('upload', 'Upload')}
            </Button>
            <Button kind="secondary" onClick={closeWorkspace}>
              {t('cancel', 'Cancel')}
            </Button>
          </div>
        </Stack>
      </div>
    </Form>
  );
}


