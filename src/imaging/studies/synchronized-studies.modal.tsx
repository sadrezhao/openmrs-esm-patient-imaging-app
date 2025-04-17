import React from 'react';
import { useTranslation } from 'react-i18next';
import { DicomStudy } from '../../types';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import dayjs from 'dayjs';
import {
  DataTable,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import {
    compare,
    EmptyState,
    PatientChartPagination,
  } from '@openmrs/esm-patient-common-lib';
  import {
    formatDate,
    useLayoutType,
    usePagination,
  } from '@openmrs/esm-framework';

import styles from './studies.scss';
import { studiesCount } from '../constants';
import { useMappingStudy } from '../../api';
import { Button } from '@carbon/react';

type SynchronizeStudiesModalProps = {
    onClose: () => void;
    studies: Array<DicomStudy>;
    patientUuid: string;
}

interface StudiesTableProps {
    studies: Array<DicomStudy>;
  }

const SynchronizedStudiesModal: React.FC<SynchronizeStudiesModalProps> = ({ onClose, studies, patientUuid}) => {

    console.log("++++++++ show modal: 1", studies);
    console.log("++++++++ show modal: 1", patientUuid);

    const { t } = useTranslation();
    const layout = useLayoutType();
    const isTablet = layout === 'tablet';
    const headerTitle = t('Studies', 'Studies');

    function StudiesTable ({studies}: StudiesTableProps) {
        const { results, goTo, currentPage } = usePagination(studies ?? [], studiesCount);

        const tableHeaders = [
            { key: 'checkbox', header: ''},
            { key: 'studyInstanceUID', header: t('studyInstanceUID', 'StudyInstanceUID') },
            { key: 'patientName', header: t('patientName', 'PatientName'), isSortable: true },
            { key: 'studyDate', header: t('studyDate', 'StudyDate'), isSortable: true },
            { key: 'studyDescription', header: t('description', 'Description') },
            { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'OrthancBaseUrl') },
            { key: 'action', header: t('action', 'Action') },
        ];

        const tableRows = results.map((study, index) => ({
            checkbox: (
                <input type="checkbox" value={study.id} 
                    onChange={(e) => {useMappingStudy(study, patientUuid)}} />
            ),
            studyInstanceUID: <div className={styles.wrapText}>{study.studyInstanceUID}</div>,
            patientName: {
                sortKey: study.patientName,
                content: <span>{study.patientName}</span>
            },
            studyDate: {
                sortKey: dayjs(study.studyDate).toDate(),
                content: <span>{formatDate(new Date(study.studyDate))}</span>
            },
            studyDescription: study.studyDescription,
            orthancConfiguration: study.orthancConfiguration.orthancBaseUrl,
            action: {
                content: (
                    <div className="flex gap-1">
                    <IconButton
                        kind="ghost"
                        align="left"
                        size={isTablet ? 'lg' : 'sm'}
                        label={t('stoneviewer', 'Stoneviewer')}
                        onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/stoneview/${study.id}`}
                    >
                        <img className="stone-img" src={stoneview} style={{ width: 23, height: 14, marginTop: 4 }} />
                    </IconButton>
                    <IconButton
                        kind="ghost"
                        align="left"
                        size={isTablet ? 'lg' : 'sm'}
                        label={t('ohifviewer', 'Ohifviewer')}
                        onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/ohifview/${study.id}`}
                    >
                        <img className="orthanc-img" src={ohifview} style={{ width: 26, height: 26, marginTop: 0 }} />
                    </IconButton>
                    </div>
                )
            }
        }));

        const sortRow = (cellA, cellB, { sortDirection, sortStates }) => {
            return sortDirection === sortStates.DESC
            ? compare(cellB.sortKey, cellA.sortKey)
            : compare(cellA.sortKey, cellB.sortKey);
        };

        return (
            <div className={'studiesTableDiv'}>
                <DataTable
                    rows={tableRows}
                    headers={tableHeaders}
                    sortRow={sortRow}
                    isSortable
                    useZebraStyles
                    size={isTablet ? 'lg' : 'sm'}
                >
                {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
                    <TableContainer>
                    <Table {...getTableProps()} className={styles.table}>
                        <TableHead>
                        <TableRow>
                            {headers.map((header) => (
                            <TableHeader key={header.key} {...getHeaderProps({ header })}>
                                {header.header}
                            </TableHeader>
                            ))}
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {rows.map((row, rowIndex) => {
                            return (
                                <React.Fragment key={rowIndex}>
                                    <TableRow className={styles.row}>
                                        {row.cells.map((cell) => (
                                            <TableCell key={cell.id} className={styles.tableCell}>
                                                {cell.value?.content ?? cell.value}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                        </TableBody>
                    </Table>
                    </TableContainer>
                )}
                </DataTable>
                <PatientChartPagination
                    pageNumber={currentPage}
                    totalItems={studies.length}
                    currentItems={results.length}
                    pageSize={studiesCount}
                    onPageNumberChange={({ page }) => goTo(page)}
                />
            </div>
        )
    }

    return (
        <div>
            <ModalHeader closeModal={onClose} title={t('synchronize', 'synchronize studies')} />
            <ModalBody>xxx</ModalBody>
            {/* <Modal
                onRequestClose={onClose}
                modalHeading={t('retrievedStudies', 'Retrieved Studies')}
                primaryButtonText={t('close', 'Close')}
                onRequestSubmit={onClose}
                size="lg"
            >
                {studies && studies.length > 0 ? (

                    console.log("++++++++ show modal: 2", studies.length),
                    
                        <StudiesTable studies={studies}></StudiesTable>
                    ) : (
                        <EmptyState displayText={"No studies found"} headerTitle={headerTitle} />
                    )
                }
            </Modal> */}
            <ModalFooter>
                <Button kind="secondary" onClick={onClose}>
                    {t('cancel', 'Cancel')}
                    </Button>
            </ModalFooter>
        </div>
    )
}

export default SynchronizedStudiesModal;