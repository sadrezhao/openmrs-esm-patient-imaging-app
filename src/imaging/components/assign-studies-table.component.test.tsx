import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import AssignStudiesTable, { AssignStudiesTableProps } from './assign-studies-table.component';
import { updateStudyMatchingStatus } from '../../api';
import * as AssignStudiesModule from './assign-studies-table.component';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

jest.mock('../../api');

jest.mock('../../types', () => ({}));

jest.mock('@openmrs/esm-framework', () => ({
  useLayoutType: () => 'desktop',
  usePagination: (data: any[], pagesize: number) => ({
    results: data.slice(0, pagesize),
    goto: jest.fn(),
    currentPage: 1,
  }),
}));

jest.mock('@openmrs/esm-patient-common-lib', () => ({
  compare: jest.fn((a, b) => (a > b ? 1 : a < b ? -1 : 0)),
  PatientChartPagination: ({ pageNumber, totalItems }: any) => (
    <div data-testid="pagination">
      Page {pageNumber} of {totalItems}
    </div>
  ),
  EmptyState: ({ displayText }: any) => <div data-testid="empty-state">{displayText}</div>,
}));

jest.mock('./series-details-table.component', () => () => <div>Series Details</div>);

describe('AssignStudiesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConfig = {
    id: 1,
    orthancBaseUrl: 'http://orthanc.local',
    orthancProxyUrl: '',
  };

  const defaultProps: AssignStudiesTableProps = {
    patientUuid: '1234-5678-9012-3456',
    assignStudyFunction: jest.fn(),
    data: {
      studies: [
        {
          id: 1,
          studyInstanceUID: '1.2.3',
          matching: -1,
          comparisonResult: JSON.stringify({
            score: 85, // numeric score
            differences: [
              {
                tag: 'PatientID',
                fromOpenmrs: '12345',
                fromPacs: '67890',
                stepId: '1',
              },
              {
                tag: 'Modality',
                fromOpenmrs: 'CT',
                fromPacs: 'MR',
                stepId: '1',
              },
              {
                tag: 'AccessionNumber',
                fromOpenmrs: 'ACC-001',
                fromPacs: 'ACC-002',
                stepId: '1',
              },
            ],
          }),
          patientName: 'John Doe',
          studyDate: '2023-01-01',
          studyDescription: 'Description of study 1',
          orthancStudyUID: 'orthancUID_1.2.3',
          orthancConfiguration: mockConfig,
          mrsPatientUuid: null,
        },
        {
          id: 2,
          studyInstanceUID: '4.5.6',
          matching: 0,
          comparisonResult: JSON.stringify({
            score: 85, // numeric score
            differences: [
              {
                tag: 'PatientID',
                fromOpenmrs: '12345',
                fromPacs: '67890',
                stepId: '1',
              },
              {
                tag: 'Modality',
                fromOpenmrs: 'CT',
                fromPacs: 'MR',
                stepId: '1',
              },
              {
                tag: 'AccessionNumber',
                fromOpenmrs: 'ACC-001',
                fromPacs: 'ACC-002',
                stepId: '1',
              },
            ],
          }),
          patientName: 'Jane Smith',
          studyDate: '2023-02-15',
          studyDescription: 'Description of study 2',
          orthancStudyUID: 'orthancUID_4.5.6',
          orthancConfiguration: mockConfig,
          mrsPatientUuid: '1234-5678-9012-3456', // assigned study
        },
      ],
      scores: new Map([
        ['1.2.3', 80],
        ['4.5.6', 95],
      ]),
    },
  };

  it('renders empty state when no studies are available', () => {
    render(<AssignStudiesTable {...defaultProps} data={{ studies: [], scores: new Map<string, number>() }} />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('studies');
  });

  it('renders table with studies and pagination', () => {
    render(<AssignStudiesTable {...defaultProps} />);

    // Verify patient names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Grab data rows (skip header)
    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1);

    // Check John Doe row
    expect(within(dataRows[0]).getByText('John Doe')).toBeInTheDocument();
    expect(within(dataRows[0]).getByText(/80%/)).toBeInTheDocument();

    // Check Jane Smith row
    expect(within(dataRows[1]).getByText('Jane Smith')).toBeInTheDocument();
    expect(within(dataRows[1]).getByText(/95%/)).toBeInTheDocument();
  });

  it('calls assignStudyFunction when checkbox is toggled', () => {
    const assignMock = jest.fn();
    render(<AssignStudiesTable {...defaultProps} assignStudyFunction={assignMock} />);

    const checkbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    act(() => {
      fireEvent.click(checkbox);
    });

    expect(assignMock).toHaveBeenCalledWith(defaultProps.data!.studies[0], 'true');
  });

  it('sorts studies when sortable headers are clicked', () => {
    render(<AssignStudiesTable {...defaultProps} />);
    const header = screen.getByText('Patient name');
    fireEvent.click(header);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('expands row on double click to show series details', () => {
    render(<AssignStudiesTable {...defaultProps} />);
    const row = screen.getByText('John Doe').closest('tr');
    expect(screen.queryByText('Series Details')).not.toBeInTheDocument();

    fireEvent.doubleClick(row);
    expect(screen.getByText('Series Details')).toBeInTheDocument();
  });

  it('renders pagination controls when there are multiple pages of studies', () => {
    render(<AssignStudiesTable {...defaultProps} />);
    expect(screen.getByTestId('pagination')).toHaveTextContent(`Page 1 of ${defaultProps.data!.studies.length}`);
  });

  // it('assigns and unassigns studies correctly', async () => {
  //   const assignMock = jest.fn();
  //   (updateStudyMatchingStatus as jest.Mock).mockResolvedValue({});

  //   render(<AssignStudiesTable {...defaultProps} assignStudyFunction={assignMock} />);

  //   const johnCheckbox = screen.getByTestId('assign-checkbox-1') as HTMLInputElement;
  //   const janeCheckbox = screen.getByTestId('assign-checkbox-2') as HTMLInputElement;

  //   // Initial states
  //   expect(johnCheckbox.checked).toBe(true);  // unassigned
  //   expect(janeCheckbox.checked).toBe(true);   // assigned

  //   // Assign John Doe
  //   await act(async () => {
  //     fireEvent.change(johnCheckbox);
  //   });

  //   console.log('+++++++++ study: ', defaultProps.data!.studies[0].id);
  //   expect(assignMock).toHaveBeenCalledWith(defaultProps.data!.studies[0]);
  //   expect(updateStudyMatchingStatus).toHaveBeenCalledWith(
  //     0,
  //     defaultProps.data!.studies[0].id,
  //     expect.any(AbortController)
  //   );

  //   // Unassign Jane Smith
  //   await act(async () => {
  //     fireEvent.change(janeCheckbox);
  //   });

  //   expect(assignMock).toHaveBeenCalledWith(defaultProps.data!.studies[1]);
  //   expect(updateStudyMatchingStatus).toHaveBeenCalledWith(
  //     -1,
  //     defaultProps.data!.studies[1].id,
  //     expect.any(AbortController)
  //   );
  // });
});
