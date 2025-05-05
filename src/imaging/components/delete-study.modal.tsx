import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { showSnackbar } from '@openmrs/esm-framework';
import { deleteStudy, useStudiesByPatient } from '../../api';
import { RadioButtonGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import styles from './modal.scss';

interface DeleteStudyModalProps {
  closeDeleteModal: () => void;
  studyId: number;
  patientUuid: string;
}

const DeleteStudyModal: React.FC<DeleteStudyModalProps> = ({ closeDeleteModal, studyId, patientUuid }) => {
  const { t } = useTranslation();
  const { mutate } = useStudiesByPatient(patientUuid);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedOption, setSelectedOption] = useState('openmrs');

  const handleOptionChange = (valueOrEvent) => {
    setSelectedOption(valueOrEvent?.target?.value || valueOrEvent);
  };

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    deleteStudy(studyId, selectedOption, new AbortController())
      .then((response) => {
        if (response.ok) {
          mutate();
          closeDeleteModal();
          showSnackbar({
            isLowContrast: true,
            kind: 'success',
            title: t('studyDeleted', 'Study deleted'),
          });
        }
      })
      .catch((error) => {
        console.error('Error deleting study: ', error);

        showSnackbar({
          isLowContrast: false,
          kind: 'error',
          title: t('errorDeletingStudy', 'Error deleting study'),
          subtitle: error?.message,
        });
      });
  }, [closeDeleteModal, studyId, mutate, t, selectedOption]);

  return (
    <div>
      <ModalHeader closeModal={closeDeleteModal} title={t('deletePatientStudy', 'Delete study')} />
      <ModalBody>
        <p>{t('deleteModalConfirmationText', 'Are you sure you want to delete this study?')}</p>
        <RadioButtonGroup
          className={styles.radioButtonGroup}
          onChange={(value) => handleOptionChange(value)}
          valueSelected={selectedOption}
        >
          <RadioButton value="openmrs" id="openmrs" labelText="From OpenMRS" />
          <RadioButton value="both" id="both" labelText="From Orthanc & OpenMRS" />
        </RadioButtonGroup>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeDeleteModal}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? (
            <InlineLoading description={t('deleting', 'Deleting') + '...'} />
          ) : (
            <span>{t('delete', 'Delete')}</span>
          )}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default DeleteStudyModal;
