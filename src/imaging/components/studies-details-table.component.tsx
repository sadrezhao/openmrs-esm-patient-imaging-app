import React, { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  DataTable,
  Button,
  IconButton,
  InlineLoading,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import {
  CardHeader,
  compare,
  PatientChartPagination,
  launchPatientWorkspace,
  EmptyState,
  DefaultPatientWorkspaceProps
} from '@openmrs/esm-patient-common-lib';

import {
    AddIcon,
    formatDate,
    useLayoutType,
    usePagination,
  } from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { DicomStudy } from '../../types';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import SeriesDetailsTable  from './series-details-table.component';
import styles from './details-table.scss';
import { studiesCount, synchronizeStudiesFormWorkspace, uploadStudiesFormWorkspace } from '../constants';

export interface StudyDetailsTableProps {
  isValidating?: boolean;
  studies?: Array<DicomStudy> | null;
  showDeleteButton?: boolean;
  patientUuid: string;
}

const PatientStudiesTable: React.FC<StudyDetailsTableProps> = ({
  isValidating,
  studies,
  showDeleteButton,
  patientUuid
}) => {
  const { t } = useTranslation();
  const displayText = t('studies', 'studies');
  const headerTitle = t('Studies', 'Studies');
  const { results, goTo, currentPage } = usePagination(studies ?? [], studiesCount);
  const [expandedRows, setExpandedRows] = useState({});
  const launchUploadStudiesForm = useCallback(() => launchPatientWorkspace(uploadStudiesFormWorkspace), []);
  const launchSynchronizeStudiesForm = useCallback(() => launchPatientWorkspace(synchronizeStudiesFormWorkspace), []);


  const layout = useLayoutType();
  const isTablet = layout === 'tablet';

  const tableHeaders = [
    { key: 'studyInstanceUID', header: t('studyInstanceUID', 'StudyInstanceUID')},
    { key: 'patientName', header: t('patientName', 'PatientName'), isSortable: true, isVisible: true},
    { key: 'studyDate', header: t('studyDate', 'StudyDate'), isSortable: true, isVisible: true},
    { key: 'studyDescription', header: t('description', 'description')},
    { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'OrthancBaseUrl')},
    { key: 'action', header: t('action', 'Action')},
  ]

  const tableRows = results?.map((study, index) => ({
    id: study.id ?? `row-${index}`,
    studyInstanceUID: <div className={styles.wrapText}>{study.studyInstanceUID}</div>,
    patientName: {
      sortKey: study.patientName,
      content: (
        <div className={"patientColumn"}>
          <span>{study.patientName}</span>
        </div>
      )
    },
    studyDate: {
      sortKey: dayjs(study.studyDate).toDate(),
      content: (
        <div className={"studyDateColumn"}>
          <span>{formatDate(new Date(study.studyDate))}</span>
        </div>)
    },
    studyDescription: study.studyDescription,
    orthancConfiguration: study.orthancConfiguration.orthancBaseUrl,
    action: {
      content:(
        <div className="flex gap-1">
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('stoneviewer', 'Stoneviewer')}
            onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/stoneview/${study.id}`} 
            >
              <img className='stone-img' src={stoneview} style={{width:23, height:14, marginTop: 4}}></img>
          </IconButton>
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('ohifviewer', 'Ohifviewer')}
            onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/ohifview/${study.id}`} 
            >
               <img className='orthanc-img' src={ohifview} style={{width:26,height:26, marginTop:0}}></img>
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

  if (studies && studies?.length) {
  return (
    <div className={styles.widgetCard}>
      <CardHeader title={headerTitle}>
        <span>{isValidating ? <InlineLoading/>: null}</span>
        <div className={styles.buttons}>
          <Button
            kind="ghost"
            renderIcon={(props) => <AddIcon size={16} {...props} />}
            iconDescription={t('upload','Upload')}
            onClick={launchUploadStudiesForm}
          >
            {t('upload', 'Upload')}
          </Button>
          <Button
            kind="ghost"
            renderIcon={(props) => <AddIcon size={16} {...props} />}
            iconDescription={t('synchronizeStudies','SynchronizeStudies')}
            onClick={launchSynchronizeStudiesForm}
          >
            {t('synchroize', 'Synchroize')}
          </Button>
        </div>
      </CardHeader>
      <DataTable 
        rows={tableRows} 
        headers={tableHeaders}
        sortRow={sortRow}
        isSortable 
        useZebraStyles
        data-floating-menu-container
        size={isTablet ? 'lg' : 'sm'}
        >
          {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
            <TableContainer>
              <Table aria-label="Studies summary" className={styles.table} {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      {...getHeaderProps({
                        header,
                        isSortable: header.isSortable,
                      })}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                  <TableHeader />
                </TableRow>
              </TableHead>
              <TableBody>
                  {rows.map((row, rowIndex) => {
                    const isExpanded = expandedRows[rowIndex];
                    return (
                      <React.Fragment key={rowIndex}>
                        <TableRow
                          className={styles.row}
                          {...getRowProps({ row })}
                          onDoubleClick={() =>
                            setExpandedRows((prev) => ({
                              ...prev,
                              [rowIndex]: !prev[rowIndex],
                            }))
                          }
                        >
                          {row.cells.map((cell) => (
                            <TableCell className={styles.tableCell} key={cell.id}>
                              {cell.value?.content ?? cell.value}
                            </TableCell>
                          ))}
                        </TableRow>
                        {isExpanded && (
                          <TableRow className={styles.expandedRow}>
                            <TableCell colSpan={headers.length}>
                              <div className={styles.seriesTableDiv}>
                                <SeriesDetailsTable 
                                  study = {row} 
                                  patientUuid={patientUuid}
                                  />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
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
  );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
}

export default PatientStudiesTable;

function onRemoveClick() {
  throw new Error('Function not implemented.');
}

