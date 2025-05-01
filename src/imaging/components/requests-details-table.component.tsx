import React, { useCallback, useRef, useState } from 'react';
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
    useLayoutType,
    usePagination,
    TrashCanIcon,
    showModal,
    launchWorkspace,
  } from '@openmrs/esm-framework';

import { useTranslation } from 'react-i18next';
import { RequestProcedure } from '../../types';
import { addNewProcedureStepWorkspace, addNewRequestWorkspace, requestCount, requestDeleteConfirmationDialog } from '../constants';
import ProcedureStepTable from './procedureStep-details-table.component';
import styles from './details-table.scss';

  export interface RequestProcedureTableProps {
    isValidating?: boolean;
    requests?: Array<RequestProcedure> | null;
    showDeleteButton?: boolean;
    patientUuid: string;
  }

  const RequestProcedureTable: React.FC<RequestProcedureTableProps> = ({
    isValidating,
    requests,
    patientUuid
  }) => {
    const { t } = useTranslation();
    const displayText = t('requestProcedure', 'RequestProcedure');
    const headerTitle = t('requestProcedure', 'RequestProcedure');
    const { results, goTo, currentPage } = usePagination(requests, requestCount);
    const [expandedRows, setExpandedRows] = useState({});
    const shouldOnClickBeCalled = useRef(true);
    const layout = useLayoutType();
    const isTablet = layout === 'tablet';
    const launchAddNewRequestWorkspace = useCallback(() => launchPatientWorkspace(addNewRequestWorkspace), []);
    
  
    const launchDeleteRequestDialog = (requestId: number) => {
    const dispose = showModal(requestDeleteConfirmationDialog, {
        closeDeleteModal: () => dispose(),
        requestId,
        patientUuid,
    });
    }

    const tableHeaders = [
        { key: 'id', header: t('requestID', 'RequestID')},
        { key: 'status', header: t('status', 'Status'), isSortable: true, isVisible: true},
        { key: 'priority', header: t('priority', 'Priority'), isSortable: true, isVisible: true},
        { key: 'requestingPhysician', header: t('requestingPhysician', 'requestingPhysician'), isSortable: true, isVisible: true},
        { key: 'studyInstanceUID', header: t('studyInstanceUID', 'StudyInstanceUID')},
        { key: 'requestDescription', header: t('description', 'description')},
        { key: 'orthancConfiguration', header: t('orthancBaseUrl', 'OrthancBaseUrl')},
        { key: 'action', header: t('action', 'Action')},
    ]

    const tableRows = results?.map((request, id) => ({
        id: request.id,
        status: {
            sortKey: request.status,
            content: (<div><span>{request.status}</span></div>)
        },
        priority: {
            sortKey: request.priority,
            content: (<div><span>{request.priority}</span></div>)
        },
        requestingPhysician: {
            sortKey: request.priority,
            content: (<div><span>{request.requestingPhysician}</span></div>)
        },
        studyInstanceUID: <div className={styles.subTableWrapText}>{request.studyInstanceUID}</div>,
        requestDescription: request.requestDescription,
        orthancConfiguration: request.orthancConfiguration.orthancBaseUrl,
        action: {
            content:(
              <div className="requestBtn" style={{display: 'flex'}}>
                <IconButton
                  kind="ghost"
                  align="left"
                  size={isTablet ? 'lg' : 'sm'}
                  label={t('removeRequst', 'Remove requst')}
                  onClick={() => {
                    shouldOnClickBeCalled.current = false;
                    launchDeleteRequestDialog(request.id)
                  }}
                >
                  <TrashCanIcon className={styles.removeButton} />
                </IconButton>
                <IconButton
                  kind="ghost"
                  align="left"
                  size={isTablet ? 'lg' : 'sm'}
                  label={t('addProcedureStep', 'Add procedure step')}
                  onClick={() => {
                    shouldOnClickBeCalled.current = false;
                    launchWorkspace(addNewProcedureStepWorkspace, {request: request})
                  }}
                >
                  <AddIcon className={styles.addButton} />
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

    if(requests?.length) {
        return (
          <div className={styles.widgetCard}>
            <CardHeader title={headerTitle}>
                <span>{isValidating ? <InlineLoading/>: null}</span>
                <div className={styles.buttons}>
                    <Button
                    kind="ghost"
                    renderIcon={(props) => <AddIcon size={16} {...props} />}
                    iconDescription={t('add', 'Add')}
                    onClick={launchAddNewRequestWorkspace}
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
                    <Table aria-label="Reqeusts summary" className={styles.table} {...getTableProps()}>
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
                                        {row.cells.map((cell) => (
                                            <TableCell className={styles.tableCell} key={cell.id}>
                                                {cell.value?.content ?? cell.value}
                                            </TableCell>
                                        ))}
            
                                    </TableRow>
                                    {isExpanded && (
                                    <TableRow className={styles.expandedRow}>
                                        <TableCell colSpan={headers.length}>
                                            <div className={styles.procedureStepTableDiv}>
                                                <ProcedureStepTable 
                                                    requestProcedure={row}
                                                    patientUuid={patientUuid} 
                                                />                                           
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                    </Table>
                </TableContainer>
               )}
            </DataTable>
            <PatientChartPagination
                pageNumber={currentPage}
                totalItems={requests.length}
                currentItems={results.length}
                pageSize={requestCount}
                onPageNumberChange={({ page }) => goTo(page)}
            />
        </div>
        );
    }
    return <EmptyState displayText={displayText} headerTitle={headerTitle}/>;
  }

export default RequestProcedureTable;