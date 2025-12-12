import React, { useMemo, useRef, useState } from 'react';
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
  InlineLoading,
} from '@carbon/react';
import { compare, PatientChartPagination, EmptyState, CardHeader } from '@openmrs/esm-patient-common-lib';

import { showModal, TrashCanIcon, useLayoutType, usePagination } from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { getBrowserUrl, type DicomStudy } from '../../types';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import orthancExplorer from '../../assets/orthanc.png';
import SeriesDetailsTable from './series-details-table.component';
import {
  studiesCount,
  studyDeleteConfirmationDialog,
  linkStudyConfirmationDialog,
  unlinkStudyConfirmationDialog,
} from '../constants';
import styles from './details-table.scss';
import { buildURL, convertToDate, formatDate } from '../utils/help';
import { set } from 'zod';

export interface StudyDetailsTableProps {
  isValidating?: boolean;
  studies?: Array<DicomStudy> | null;
  showDeleteButton?: boolean;
  patientUuid: string;
}

/**
 * The content of the DICOM study details.
 */
const StudiesDetailTable: React.FC<StudyDetailsTableProps> = ({
  isValidating,
  studies,
  showDeleteButton,
  patientUuid,
}) => {
  const { t } = useTranslation();
  const displayText = t('studiesNoFoundMessage', 'No studies found');
  const headerTitle = t('Studies', 'Studies');
  const [studyDateFilter, setStudyDateFilter] = useState<string>('');
  const [studyDescFilter, setStudyDescFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState({});
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const shouldOnClickBeCalled = useRef(true);
  const studyMap = useRef<Map<string, DicomStudy>>(new Map());

  const launchDeleteStudyDialog = (studyId: number) => {
    const dispose = showModal(studyDeleteConfirmationDialog, {
      closeDeleteModal: () => dispose(),
      studyId,
      patientUuid,
    });
  };

  const filterStudies = useMemo(() => {
    return studies.filter((study) => {
      const matchStudyDate = studyDateFilter
        ? study.studyDate.toLowerCase().includes(studyDateFilter.toLowerCase())
        : true;

      const matchStudyDesc = studyDescFilter
        ? study.studyDescription.toLowerCase().includes(studyDescFilter.toLowerCase())
        : true;

      return matchStudyDate && matchStudyDesc;
    });
  }, [studies, studyDateFilter, studyDescFilter]);

  const { results, goTo, currentPage } = usePagination(filterStudies, studiesCount);

  studies?.forEach((study) => {
    studyMap.current.set(String(study.id), study);
  });

  const tableHeaders = useMemo(
    () => [
      { key: 'studyInstanceUID', header: t('studyInstanceUID', 'Study instance UID'), isSortable: true },
      { key: 'linkStatus', header: t('linkStatus', 'Linking'), isSortable: true },
      { key: 'patientName', header: t('patientName', 'Patient name'), isSortable: true },
      { key: 'studyDate', header: t('studyDate', 'Study date'), isSortable: true },
      { key: 'studyDescription', header: t('description', 'description'), isSortable: true },
      { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'The configured Orthanc Url'), isSortable: true },
      { key: 'action', header: t('action', 'Action'), isSortable: false },
    ],
    [t],
  );

  /** The link status:
   * Manual - complete matched and confirmed
   * Auto.unsure - Automatic link is not 100% accurate when comparing the meta-patient data in OpenMRS and PACS. It needs confirmat to 'Manual'
   * Auto.100%: Automatic link is 100% accurate when comparing meta-patient data in OpenMRS and PACS. It needs to be confirmed as 'Manual'.
   * Unlink: Remove link.
   */
  const tableRows = results?.map((study) => ({
    id: study.id.toString(),
    studyInstanceUID: <div className={styles.wrapText}>{study.studyInstanceUID}</div>,
    linkStatus: (
      <select
        value={study.linkStatus}
        className={styles.matchingSelect}
        onChange={(e) => {
          const newLinkStatus = parseInt(e.target.value);
          if (newLinkStatus == -1) {
            const dispose = showModal(unlinkStudyConfirmationDialog, {
              closeUnlinkModal: () => dispose(),
              studyId: study.id,
              patientUuid,
            });
          } else {
            const dispose = showModal(linkStudyConfirmationDialog, {
              closeLinkingStudyModal: () => dispose(),
              linkStatus: newLinkStatus,
              comparisonResult: study.comparisonResult,
              studyId: study.id,
              patientUuid,
            });
          }
        }}
      >
        <option value="0">Manual</option>
        <option value="1">Auto. unsure</option>
        <option value="2">Auto. 100%</option>
        <option value="-1">Unlink</option>
      </select>
    ),
    patientName: {
      sortKey: study.patientName,
      content: (
        <div className={'patientColumn'}>
          <span>{study.patientName}</span>
        </div>
      ),
    },
    studyDate: (
      <div className={'studyDateColumn'}>{study.studyDate ? formatDate(convertToDate(study.studyDate)!) : ''}</div>
    ),
    studyDescription: study.studyDescription,
    orthancConfiguration: study.orthancConfiguration.orthancBaseUrl,
    action: {
      content: (
        <div className="studiesActionDiv" style={{ display: 'flex' }}>
          {showDeleteButton && (
            <IconButton
              kind="ghost"
              align="left"
              size={isTablet ? 'lg' : 'sm'}
              label={t('removeStudy', 'Remove study')}
              onClick={() => {
                shouldOnClickBeCalled.current = false;
                launchDeleteStudyDialog(study.id);
              }}
            >
              <TrashCanIcon className={styles.removeButton} />
            </IconButton>
          )}
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('stoneviewer', 'Stone viewer of Orthanc')}
            onClick={() =>
              (window.location.href = buildURL(
                getBrowserUrl(study.orthancConfiguration),
                '/stone-webviewer/index.html',
                [{ code: 'study', value: study.studyInstanceUID }],
              ))
            }
          >
            <img className="stone-img" src={stoneview} style={{ width: 23, height: 14, marginTop: 4 }}></img>
          </IconButton>
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('ohifviewer', 'Ohif viewer')}
            onClick={() =>
              (window.location.href = buildURL(getBrowserUrl(study.orthancConfiguration), '/ohif/viewer', [
                { code: 'StudyInstanceUIDs', value: study.studyInstanceUID },
              ]))
            }
          >
            <img className="ohif-img" src={ohifview} style={{ width: 26, height: 26, marginTop: 0 }}></img>
          </IconButton>
          <IconButton
            kind="ghost"
            align="left"
            size={isTablet ? 'lg' : 'sm'}
            label={t('orthancExplorer2', 'Show data in orthanc explorer')}
            onClick={
              () =>
                (window.location.href = buildURL(
                  getBrowserUrl(study.orthancConfiguration),
                  '/ui/app/#/filtered-studies',
                  [
                    { code: 'StudyInstanceUID', value: study.studyInstanceUID },
                    { code: 'expand', value: 'series' },
                  ],
                ))

              // `${getBrowserUrl(study.orthancConfiguration)}/ui/app/#/filtered-studies?StudyInstanceUID=${study.studyInstanceUID}&expand=series`)
            }
          >
            <img className="orthanc-img" src={orthancExplorer} style={{ width: 26, height: 26, marginTop: 0 }}></img>
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

  if (studies && studies?.length) {
    return (
      <div className={styles.widgetCard}>
        <CardHeader title={headerTitle}>
          <span>{isValidating ? <InlineLoading /> : null}</span>
          <div className={styles.filterContainer}>
            <input
              style={{ marginRight: '20px' }}
              type="text"
              placeholder={t('filterByStudyDate', 'Filter by study date')}
              value={studyDateFilter}
              onChange={(e) => setStudyDateFilter(e.target.value)}
              className={styles.filterInput}
            />
            <input
              type="text"
              placeholder={t('filterByStudyDescription', 'Filter by study description')}
              value={studyDescFilter}
              onChange={(e) => setStudyDescFilter(e.target.value)}
              className={styles.filterInput}
            />
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
                      <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                    ))}
                    <TableHeader />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const isExpanded = expandedRows[row.id];
                    const studyData = studyMap.current.get(row.id);
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow
                          className={styles.row}
                          {...getRowProps({ row })}
                          onDoubleClick={() =>
                            setExpandedRows((prev) => ({
                              ...prev,
                              [row.id]: !prev[row.id],
                            }))
                          }
                        >
                          {row.cells.map((cell) => (
                            <TableCell className={styles.tableCell} key={cell.id}>
                              {cell.value?.content ?? cell.value}
                            </TableCell>
                          ))}
                        </TableRow>
                        {isExpanded && studyData && (
                          <TableRow className={styles.expandedRow}>
                            <TableCell colSpan={headers.length}>
                              <div className={styles.seriesTableDiv}>
                                <SeriesDetailsTable
                                  studyId={studyData.id}
                                  studyInstanceUID={studyData.studyInstanceUID}
                                  patientUuid={patientUuid}
                                  orthancConfig={studyData.orthancConfiguration}
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
          data-testid="pagination"
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
};

export default StudiesDetailTable;
