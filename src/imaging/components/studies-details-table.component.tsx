import React, { useRef, useState} from 'react';
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
} from '@carbon/react';
import {
  CardHeader,
  compare,
  PatientChartPagination,
  launchPatientWorkspace,
  EmptyState,
} from '@openmrs/esm-patient-common-lib';

import {
  showModal,
    TrashCanIcon,
    useLayoutType,
    usePagination,
  } from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { DicomStudy } from '../../types';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import orthancExplorer from '../../assets/orthanc.png';
import SeriesDetailsTable  from './series-details-table.component';
import { studiesCount, studyDeleteConfirmationDialog } from '../constants';
import styles from './details-table.scss';


export interface StudyDetailsTableProps {
  isValidating?: boolean;
  studies?: Array<DicomStudy> | null;
  showDeleteButton?: boolean;
  patientUuid: string;
}

const StudiesDetailTable: React.FC<StudyDetailsTableProps> = ({
  isValidating,
  studies,
  showDeleteButton,
  patientUuid,
}) => {
  const { t } = useTranslation();
  const displayText = t('studies', 'studies');
  const headerTitle = t('Studies', 'Studies');
  const { results, goTo, currentPage } = usePagination(studies ?? [], studiesCount);
  const [expandedRows, setExpandedRows] = useState({});
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const shouldOnClickBeCalled = useRef(true);

  const launchDeleteStudyDialog = (studyId: number) => {
    const dispose = showModal(studyDeleteConfirmationDialog, {
      closeDeleteModal: () => dispose(),
      studyId,
      patientUuid,
    });
  }

  const tableHeaders = [
    { key: 'studyInstanceUID', header: t('studyInstanceUID', 'Study instance UID')},
    { key: 'patientName', header: t('patientName', 'Patient name'), isSortable: true},
    { key: 'studyDate', header: t('studyDate', 'Study date'), isSortable: true},
    { key: 'studyDescription', header: t('description', 'description'), isSortable:false },
    { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'The configured Orthanc Url'), isSortable:true},
    { key: 'action', header: t('action', 'Action')},
  ].filter(Boolean);

  const tableRows = results?.map((study, index) => ({
    id: study.id,
    studyInstanceUID: <div className={styles.wrapText}>{study.studyInstanceUID}</div>,
    patientName: {
      sortKey: study.patientName,
      content: (
        <div className={"patientColumn"}>
          <span>{study.patientName}</span>
        </div>
      )
    },
    studyDate: <div className={"studyDateColumn"}><span>{study.studyDate}</span></div>,
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
                launchDeleteStudyDialog(study.id)
              }}
              isDelete
            >
              <TrashCanIcon className={styles.removeButton} />
            </IconButton>
          )}
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('stoneviewer', 'Stone viewer of Orthanc')}
            onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/stone-webviewer/index.html?study=${study.studyInstanceUID}`} 
            >
              <img className='stone-img' src={stoneview} style={{width:23, height:14, marginTop: 4}}></img>
          </IconButton>
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('ohifviewer', 'Ohif viewer')}
            onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/ohif/viewer?StudyInstanceUIDs=${study.studyInstanceUID}`}
            >
               <img className='ohif-img' src={ohifview} style={{width:26,height:26, marginTop:0}}></img>
          </IconButton> 
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('orthancExplorer2', 'Show data in orthanc explorer')}
            onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/ui/app/#/filtered-studies?StudyInstanceUID=${study.studyInstanceUID}&expand=series`} 
            >
                <img className='orthanc-img' src={orthancExplorer} style={{width:26,height:26, marginTop:0}}></img>
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

export default StudiesDetailTable;

