import React, { useCallback, useState } from 'react';
import styles from './details-table.scss';
import { showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import {
  Button,
  DataTable,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { updateStudyMatchingStatus, useStudiesByPatient } from '../../api';

interface MatchingStudyModalProps {
  closeMatchingStudyModal: () => void;
  matching: number;
  comparisonResult: string;
  studyId: number;
  patientUuid: string;
}

const MatchingStudyModal: React.FC<MatchingStudyModalProps> = ({
  closeMatchingStudyModal,
  matching,
  comparisonResult,
  studyId,
  patientUuid,
}) => {
  const { t } = useTranslation();
  const { mutate } = useStudiesByPatient(patientUuid);
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';

  const parsedComparisonResult = comparisonResult ? JSON.parse(comparisonResult) : { score: 0, differences: [] };

  const handleConfirmMatchingStudy = useCallback(async () => {
    try {
      await updateStudyMatchingStatus(matching, studyId, new AbortController());
      mutate();
      closeMatchingStudyModal();
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('matchingStudy', 'Study matching is confirmed'),
      });
    } catch (err: any) {
      showSnackbar({
        isLowContrast: false,
        kind: 'error',
        title: t('errorStudyMatching', 'An error occured while matching image study'),
        subtitle: err?.message,
      });
    }
  }, [closeMatchingStudyModal, matching, comparisonResult, studyId, mutate, t]);

  const tableHeader = [
    { key: 'tag', header: t('dataName', 'Data Name') },
    { key: 'fromOpenmrs', header: t('fromOpenmrs', 'From OpenMRS') },
    { key: 'fromPacs', header: t('fromPacs', 'From PACS') },
  ];

  const tableRows = parsedComparisonResult?.differences.map((row, index) => ({
    id: `row-${index}`,
    tag: (
      <div>
        <span>{row.tag}</span>
      </div>
    ),
    fromOpenmrs: (
      <div>
        <span>{row.fromOpenmrs}</span>
      </div>
    ),
    fromPacs: (
      <div>
        <span>{row.fromPacs}</span>
      </div>
    ),
  }));

  return (
    <div>
      <ModalHeader closeModal={closeMatchingStudyModal} title={t('matchingImageStudy', 'Imaging study matching')} />
      <ModalBody>
        <div>
          <h3 id="matchingScoreTitle">
            {t('calculatedMatchingScore', 'Calculated matching score: ')} {parsedComparisonResult?.score}
          </h3>
        </div>
        {parsedComparisonResult?.differences.length > 0 ? (
          <DataTable
            rows={tableRows}
            headers={tableHeader}
            useZebraStyles
            data-floating-menu-container
            size={isTablet ? 'lg' : 'sm'}
          >
            {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
              <TableContainer>
                <Table aria-label="Comparison Table" className={styles.table} {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow className={styles.row} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell className={styles.tableCell} key={cell.id}>
                            {cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        ) : (
          <div className={styles.emptyState}>{t('noComparisonData', 'No comparison data available.')}</div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button kind="primary" onClick={closeMatchingStudyModal}>
          {t('close', 'Close')}
        </Button>
        <Button kind="secondary" onClick={handleConfirmMatchingStudy}>
          {t('confirm', 'Confirm')}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default MatchingStudyModal;
