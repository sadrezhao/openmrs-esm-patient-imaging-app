import React, { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
    TrashCanIcon,
    useLayoutType,
    usePagination,
  } from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { DicomStudy } from '../../types';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import SeriesDetailsTable  from './series-details-table.component';
import styles from './details-table.scss';
import { addNewRequestWorkspace, studiesCount, synchronizeStudiesFormWorkspace, uploadStudiesFormWorkspace } from '../constants';
import { useMappingStudy } from '../../api';

export interface StudyDetailsTableProps {
  isValidating?: boolean;
  studies?: Array<DicomStudy> | null;
  showDeleteButton?: boolean;
  showCheckboxColumn: boolean;
  patientUuid: string;
}

const PatientStudiesTable: React.FC<StudyDetailsTableProps> = ({
  isValidating,
  studies,
  showDeleteButton,
  showCheckboxColumn,
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
  const shouldOnClickBeCalled = useRef(true);

  const tableHeaders = [
    showCheckboxColumn? { key: 'checkbox', header: '', isSortable:false } : null,
    { key: 'studyInstanceUID', header: t('studyInstanceUID', 'StudyInstanceUID')},
    { key: 'patientName', header: t('patientName', 'PatientName'), isSortable: true},
    { key: 'studyDate', header: t('studyDate', 'StudyDate'), isSortable: true},
    { key: 'studyDescription', header: t('description', 'description'), isSortable:false },
    { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'OrthancBaseUrl'), isSortable:true},
    { key: 'action', header: t('action', 'Action')},
  ].filter(Boolean);

  const tableRows = results?.map((study, index) => ({
    id: study.id ?? `row-${index}`,
    ...( showCheckboxColumn && {
      checkbox: (
        <input
          type="checkbox"
          value={study.id}
          onChange={(e) =>{
            if (e.target.checked) {
              useMappingStudy(study, patientUuid, true)
            } else {
              useMappingStudy(study, patientUuid, false)
            }
          }}
        />
      )
    }),
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
        {showDeleteButton && (
            <IconButton
              kind="ghost"
              align="left"
              size={isTablet ? 'lg' : 'sm'}
              label={t('removeStudy', 'RemoveStudy')}
              onClick={() => {
                shouldOnClickBeCalled.current = false;
                onRemoveClick();
              }}
            >
              <TrashCanIcon className={styles.removeButton} />
            </IconButton>
          )}
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
            {t('synchronize', 'Synchronize')}
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

