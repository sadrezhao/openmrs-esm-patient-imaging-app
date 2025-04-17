import React, { useState, useEffect } from 'react';
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
    compare,
    PatientChartPagination,
    EmptyState
  } from '@openmrs/esm-patient-common-lib';

import { useTranslation } from 'react-i18next';
import { DicomStudy } from '../../types';
import dayjs from 'dayjs';
import stoneview from '../../assets/stoneViewer.png';
import ohifview from '../../assets/ohifViewer.png';
import { useLayoutType, usePagination, formatDate, TrashCanIcon} from '@openmrs/esm-framework';
import { useStudySeries } from '../../api';
import InstancesDetailsTable from './instances-details-table.component';
import styles from './details-table.scss'
import { seriesCount } from '../constants';

export interface SeriesDetailsTableProps {
    study: DicomStudy;
    patientUuid: string;
}

const SeriesDetailsTable: React.FC<SeriesDetailsTableProps> = ({
    study,
    patientUuid
}) => {
    const {
        data: seriesList,
        error: seriesError,
        isLoading: isLoadingSeries,
        isValidating: isValidatingSeries,
      } = useStudySeries(study);
    
    const { t } = useTranslation();
    const displayText = t('series', 'Series');
    const headerTitle = t('series', 'Series');
    const { results, goTo, currentPage } = usePagination(seriesList, seriesCount);
    const [expandedRows, setExpandedRows] = useState({});
    const layout = useLayoutType();
    const isTablet = layout === 'tablet';
    
    const tableHeaders = [
        { key: 'seriesInstanceUID', header: t('seriesUID', 'SeriesUID')},
        { key: 'modality', header: t('modality', 'Modality')},
        { key: 'seriesDate', header: t('seriesDate', 'SeriesDate'), isSortable: true, isVisible: true},
        { key: 'seriesDescription', header: t('description', 'description')},
        { key: 'action', header: t('action', 'Action')},
    ]

    const tableRows = results?.map((series, index) => ({
        id: series.id ?? `row-${index}`,
        seriesInstanceUID: <div className={styles.subTableWrapText}>{ series.seriesInstanceUID}</div>,
        modality: series.modality,
        seriesDate: {
            sortKey: dayjs(series.seriesDate).toDate(),
            content: (
            <div className={"seriesDateColumn"}>
                <span>{formatDate(new Date(series.seriesDate))}</span>
            </div>
            )
        },
        seriesDescription: series.seriesDescription,
        action: {
            content:(
              <div className="flex gap-1">
                <IconButton
                  kind="ghost"
                  align="left"
                  size={isTablet ? 'lg' : 'sm'}
                  label={t('removeSeries', 'RemoveSeries')}
                  onClick={() => {
                    // shouldOnClickBeCalled.current = false;
                    onRemoveClick();
                  }}
                >
                  <TrashCanIcon className={styles.removeButton} />
                </IconButton>
                <IconButton
                  kind="ghost"
                  align="left"
                  size={isTablet ? 'lg' : 'sm'}
                  label={t('stoneviewer', 'Stoneviewer')}
                  onClick={() => window.location.href = `${series.orthancConfiguration.orthancBaseUrl}/stoneview/${series.id}`} 
                  >
                    <img className='stone-img' src={stoneview} style={{width:23, height:14, marginTop: 4}}></img>
                </IconButton>
                <IconButton
                  kind="ghost"
                  align="left"
                  size={isTablet ? 'lg' : 'sm'}
                  label={t('ohifviewer', 'Ohifviewer')}
                  onClick={() => window.location.href = `${series.orthancConfiguration.orthancBaseUrl}/ohifview/${series.id}`} 
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

    if (seriesList?.length) {
    return (
        <div className={'dataTableDiv'}>
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
                    <Table aria-label="Series summary" className={styles.table} {...getTableProps()} />
                    <TableHead>
                        <TableRow>
                            {headers.map((header, index) => (
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
                                    {row.cells.map((cell, cellIndex) => (
                                        <TableCell className={styles.tableCell} key={cellIndex}
                                            style={cellIndex===4?{ width: '15%'}:{width: '22%'}}
                                        >
                                            {cell.value?.content ?? cell.value}
                                        </TableCell>
                                        ))}
                                </TableRow>
                                {isExpanded && (
                                    <TableRow className={styles.expandedRow}>
                                        <TableCell colSpan={headers.length}
                                        >
                                            <div className={styles.instanceTableDiv}>
                                                <InstancesDetailsTable 
                                                    series={row}
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
                </TableContainer>
              )}

            </DataTable>
            <PatientChartPagination
                pageNumber={currentPage}
                totalItems={seriesList.length}
                currentItems={results.length}
                pageSize={seriesCount}
                onPageNumberChange={({ page }) => goTo(page)}
            />
        </div>
    );
    }
    return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
}


function onRemoveClick() {
    throw new Error('Function not implemented.');
}

export default SeriesDetailsTable;