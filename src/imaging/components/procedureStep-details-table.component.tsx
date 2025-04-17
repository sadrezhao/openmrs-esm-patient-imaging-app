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
    EmptyState
} from '@openmrs/esm-patient-common-lib';

import {
    AddIcon,
    formatDate,
    useLayoutType,
    usePagination,
    TrashCanIcon,
} from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { RequestProcedure, RequestProcedureStep } from '../../types';
import { addNewProcedureStepWorkspace, procedureStepCount } from '../constants';
import styles from './details-table.scss';
import { useProcedureStep } from '../../api';

export interface ProcedureStepTableProps {
    requestProcedure: RequestProcedure;
    patientUuid: string;
}

  const ProcedureStepTable: React.FC<ProcedureStepTableProps> = ({
    requestProcedure,
    patientUuid
  }) => {

    const {
        data: stepList,
        error: stepError,
        isLoading: isLoadingStep,
        isValidating: isValidatingStep,
    } = useProcedureStep(requestProcedure)

    const { t } = useTranslation();
    const displayText = t('procedureStep', 'ProcedureStep');
    const headerTitle = t('procedureStep', 'ProcedureStep');
    const { results, goTo, currentPage } = usePagination(stepList, procedureStepCount);
    const launchProcedureStepForm = useCallback(() => launchPatientWorkspace(addNewProcedureStepWorkspace), []);

    const layout = useLayoutType();
    const isTablet = layout === 'tablet';

    const tableHeaders = [
        { key: 'id', header: t('stepID', 'StepID')},
        { key: 'modality', header: t('modality', 'Modality'), isSortable: true, isVisible: true},
        { key: 'aetTitle', header: t('aetTitle', 'AetTitle')},
        { key: 'scheduledReferringPhysician', header: t('scheduledReferringPhysician', 'ScheduledReferringPhysician'), isSortable: true, isVisible: true},
        { key: 'requestedProcedureDescription', header: t('description', 'Description')},
        { key: 'stepStartDate', header: t('stepStartDate', 'StepStartDate'), isSortable: true, isVisible: true},
        { key: 'stepStartTime', header: t('time', 'Time')},
        { key: 'performedProcedureStepStatus', header: t('status', 'Status')},
        { key: 'stationName', header: t('stationName', 'SationName')},
        { key: 'procedureStepLocation', header: t('procedureStepLocation', 'ProcedureStepLocation')},
        { key: 'action', header: t('action', 'Action')},
    ]

    const tableRows = results?.map((step, id) => ({
        id: step.id,
        modality: {
            sortKey: step.modality,
            content: (<div><span>{step.modality}</span></div>)
        },
        aetTitle: step.aetTitle,
        performedProcedureStepStatus: step.performedProcedureStepStatus,
        scheduledReferringPhysician: {
            sortKey: step.scheduledReferringPhysician,
            content: (<div><span>{step.scheduledReferringPhysician}</span></div>)
        },
        requestedProcedureDescription: step.requestedProcedureDescription,
        stepStartDate: {
            sortKey: dayjs(step.stepStartDate).toDate(),
            content: (<div><span>{formatDate(new Date(step.stepStartDate))}</span></div>)
        },
        stepStartTime: step.stepStartTime,
        stationName: step.stationName,
        procedureStepLocation: step.procedureStepLocation,
        action: {
            content: (
                <div>
                    <IconButton
                        kind="ghost"
                        align="left"
                        size={isTablet ? 'lg' : 'sm'}
                        label={t('removeStudy', 'RemoveStudy')}
                        onClick={() => {
                            // shouldOnClickBeCalled.current = false;
                            onRemoveClick();
                        }}
                        >
                        <TrashCanIcon className={styles.removeButton} />
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

    if (isLoadingStep || isValidatingStep) {
        return <div>Loading ...</div>
    }

    if (!stepList?.length) {
        return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
    }
    
    if (stepList?.length) {
        return (
            <div className={styles.widgetCard}>
            <CardHeader title={headerTitle}>
                <span>{isValidatingStep ? <InlineLoading/>: null}</span>
                <div className={styles.buttons}>
                    <Button
                        kind="ghost"
                        renderIcon={(props) => <AddIcon size={16} {...props} />}
                        iconDescription={t('add', 'Add')}
                        onClick={launchProcedureStepForm}
                    >
                    {t('Add', 'Add')}
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
                         <Table aria-label="Procedure step summary" className={styles.table} {...getTableProps()} />
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
                                return (
                                    <React.Fragment key={rowIndex}>
                                        <TableRow>
                                            {row.cells.map((cell, cellIndex) => (
                                                <TableCell className={styles.tableCell} key={cellIndex}>
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
                    totalItems={stepList.length}
                    currentItems={results.length}
                    pageSize={procedureStepCount}
                    onPageNumberChange={({ page }) => goTo(page)}
                />
            </div>
        )
    }
}

function onRemoveClick() {
    throw new Error('Function not implemented.');
}

export default ProcedureStepTable

