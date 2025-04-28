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
import { DicomStudy, Series } from '../../types';
import { useLayoutType, usePagination} from '@openmrs/esm-framework';
import { getStudyInstances } from '../../api';
import preview from '../../assets/preview.png';
import orthancExplorer from '../../assets/orthanc.png';
import styles from './details-table.scss'
import { instancesCount } from '../constants';

export interface InstancesDetailsTableProps {
    study: DicomStudy,
    seriesInstanceUID: string
}

const InstancesDetailsTable: React.FC<InstancesDetailsTableProps> = ({
    study,
    seriesInstanceUID
}) => {
    const {
        data: instances,
        error: seriesError,
        isLoading: isLoadingSeries,
        isValidating: isValidatingSeries,
    } = getStudyInstances(study.id, seriesInstanceUID);

    const { t } = useTranslation();
    const displayText = t('instances', 'Instances');
    const headerTitle = t('instances', 'Instances');
    const { results, goTo, currentPage } = usePagination(instances, instancesCount);
    const layout = useLayoutType();
    const isTablet = layout === 'tablet';

    const tableHeaders = [
        { key: 'sopInstanceUID', header: t('sopInstanceUID', 'SOP Instance UID')},
        { key: 'instanceNumber', header: t('instanceNumber', 'Instance number')},
        { key: 'imagePositionPatient', header: t('imagePositionPatient', 'Image position of Patient'), isSortable: true, isVisible: true},
        { key: 'numberOfFrames', header: t('numberOfFrames', 'Number of frames')},
        { key: 'action', header: t('action', 'Action')},
    ]

    const tableRows = results?.map((instance, index) => ({
        id: instance.sopInstanceUID,
        sopInstanceUID: <div className={styles.subTableWrapText}>{ instance.sopInstanceUID}</div>,
        instanceNumber: instance.instanceNumber,
        imagePositionPatient: instance.imagePositionPatient,
        numberOfFrames: instance.numberOfFrames,
        action: {
            content:(
                <div className="flex gap-1">
                    <IconButton
                        kind="ghost"
                        align="left"
                        size={isTablet ? 'lg' : 'sm'}
                        label={t('instanceViewLocal', 'InstanceViewLocal')}
                        onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/??/${seriesInstanceUID}`} 
                    >
                        <img className='stone-img' src={preview} style={{width:23, height:23}}></img>
                    </IconButton>
                    <IconButton
                        kind="ghost"
                        align="left"
                        size={isTablet ? 'lg' : 'sm'}
                        label={t('instanceViewInOrthanc', 'Instance view in Orthanc')}
                        onClick={() => window.location.href = `${study.orthancConfiguration.orthancBaseUrl}/instances/${instance.orthancInstanceUID}/preview`} 
                    >
                        <img className='orthanc-img' src={preview} style={{width:23,height:23}}></img>
                    </IconButton> 
                    <IconButton
                        kind="ghost"
                        align="left"
                        size={isTablet ? 'lg' : 'sm'}
                        label={t('orthancExplorer2', 'Show data in orthanc explorere')}
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

    if (isLoadingSeries || isValidatingSeries) {
        return <div>Loading ...</div>
    }

    if (!instances?.length) {
        return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
    }

    return (
        <div className={'studiesTableDiv'}>
            <DataTable
                rows={tableRows} 
                headers={tableHeaders}
                sortRow={sortRow}
                isSortable 
                useZebraStyles
                data-floating-menu-container
                size={isTablet ? 'lg' : 'sm'}
            >
                {({ rows, headers, getHeaderProps, getTableProps}) => (
                <TableContainer>
                    <Table aria-label="Instances summary" className={styles.table} {...getTableProps()} />
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
                            return(
                                <React.Fragment key={rowIndex}>
                                    <TableRow className={styles.row}>
                                        {row.cells.map((cell) => (
                                            <TableCell className={styles.tableCell} key={cell.id}
                                            >
                                                {cell.value?.content ?? cell.value}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </TableContainer>
                )}
            </DataTable>
            <PatientChartPagination
                pageNumber={currentPage}
                totalItems={instances.length}
                currentItems={results.length}
                pageSize={instancesCount}
                onPageNumberChange={({ page }) => goTo(page)}
            />
        </div>
    ); 
}

export default InstancesDetailsTable;