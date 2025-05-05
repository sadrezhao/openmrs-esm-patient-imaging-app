import React, { useState } from 'react';
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
import { compare, PatientChartPagination, EmptyState } from '@openmrs/esm-patient-common-lib';
import { useLayoutType, usePagination } from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { type DicomStudy, type StudiesWithScores } from '../../types';
import { studiesCount } from '../constants';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import SeriesDetailsTable from './series-details-table.component';
import styles from './details-table.scss';

export interface AssignStudiesTableProps {
  data?: StudiesWithScores | null;
  patientUuid: string;
  assignStudyFunction: Function;
}

const AssignStudiesTable: React.FC<AssignStudiesTableProps> = ({
  data,
  patientUuid,
  assignStudyFunction: assignStudyFunction,
}) => {
  const { t } = useTranslation();
  const displayText = t('studies', 'studies');
  const headerTitle = t('Studies', 'Studies');
  const { results, goTo, currentPage } = usePagination(data.studies ?? [], studiesCount);
  const [expandedRows, setExpandedRows] = useState({});
  const [assignedStudy, setAssignedStudy] = useState({});
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';

  const getStudyScore = ({ study, data }: { study: DicomStudy; data: StudiesWithScores }) => {
    return data.scores[study.studyInstanceUID];
  };

  const studyAssignStatus = ({ study }: { study: DicomStudy }) => {
    return study.mrsPatientUuid && study.mrsPatientUuid === patientUuid;
  };

  const handleAssignChange = (study, checked) => {
    assignStudyFunction(study, checked.toString());
    setAssignedStudy((prev) => ({
      ...prev,
      [study.id]: checked,
    }));
  };

  const tableHeaders = [
    { key: 'assignCheckbox', header: '', isSortable: false },
    { key: 'score', header: t('Score', 'Score') },
    { key: 'studyInstanceUID', header: t('studyInstanceUID', 'Study instance UID') },
    { key: 'patientName', header: t('patientName', 'Patient name'), isSortable: true },
    { key: 'studyDate', header: t('studyDate', 'Study date'), isSortable: true },
    { key: 'studyDescription', header: t('description', 'description'), isSortable: false },
    { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'The configured Orthanc Url'), isSortable: true },
    { key: 'action', header: t('action', 'Action') },
  ].filter(Boolean);

  const tableRows = results?.map((study, index) => ({
    id: study.id ?? `row-${index}`,
    assignCheckbox: (
      <input
        type="checkbox"
        value={study.id}
        checked={studyAssignStatus({ study })}
        onChange={(e) => {
          const checked = e.target.checked;
          handleAssignChange(study, checked);
          study.mrsPatientUuid = checked ? patientUuid : null;
        }}
      />
    ),
    score: <div>{getStudyScore({ study, data }) + '%'}</div>,
    studyInstanceUID: <div className={styles.wrapText}>{study.studyInstanceUID}</div>,
    patientName: {
      sortKey: study.patientName,
      content: (
        <div className={'patientColumn'}>
          <span>{study.patientName}</span>
        </div>
      ),
    },
    studyDate: (
      <div className={'studyDateColumn'}>
        <span>{study.studyDate}</span>
      </div>
    ),
    studyDescription: study.studyDescription,
    orthancConfiguration: study.orthancConfiguration.orthancBaseUrl,
    action: {
      content: (
        <div className="flex gap-1">
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('stoneviewer', 'Stone viewer of Orthanc')}
            onClick={() =>
              (window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/stoneview/${study.id}`)
            }
          >
            <img className="stone-img" src={stoneview} style={{ width: 23, height: 14, marginTop: 4 }}></img>
          </IconButton>
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('ohifviewer', 'Ohif viewer')}
            onClick={() => (window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/ohifview/${study.id}`)}
          >
            <img className="orthanc-img" src={ohifview} style={{ width: 26, height: 26, marginTop: 0 }}></img>
          </IconButton>
        </div>
      ),
    },
  }));

  const sortRow = (cellA, cellB, { sortDirection, sortStates }) => {
    return sortDirection === sortStates.DESC
      ? compare(cellB.sortKey, cellA.sortKey)
      : compare(cellA.sortKey, cellB.sortKey);
  };

  if (data.studies && data.studies?.length) {
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
                                  studyId={row.id}
                                  studyInstanceUID={row.studyInstanceUID}
                                  patientUuid={patientUuid}
                                  orthancBaseUrl={row.orthancConfiguration}
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
          totalItems={data.studies.length}
          currentItems={results.length}
          pageSize={studiesCount}
          onPageNumberChange={({ page }) => goTo(page)}
        />
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
};
export default AssignStudiesTable;
