import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LinkingStudyModal from './link-study-confirmation.modal';
import { showSnackbar } from '@openmrs/esm-framework';
import { updateStudyLinkStatus, useStudiesByPatient } from '../../api';

jest.mock('@openmrs/esm-framework', () => ({
  showSnackbar: jest.fn(),
  useLayoutType: jest.fn(() => 'desktop'),
}));

jest.mock('../../api', () => ({
  updateStudyLinkStatus: jest.fn(),
  useStudiesByPatient: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}));

describe('LinkingStudyModal', () => {
  const closeModalMock = jest.fn();
  const mutateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useStudiesByPatient as jest.Mock).mockReturnValue({ mutate: mutateMock });
  });

  const defaultProps = {
    closeLinkingStudyModal: closeModalMock,
    linkStatus: 1,
    comparisonResult: JSON.stringify({
      score: 85,
      differences: [
        { tag: 'Name', fromOpenmrs: 'John Doe', fromPacs: 'John D.' },
        { tag: 'DOB', fromOpenmrs: '1990-01-01', fromPacs: '1990-01-02' },
      ],
    }),
    studyId: 123,
    patientUuid: 'patient-uuid-123',
  };

  it('renders modal with calculated score and table', () => {
    render(<LinkingStudyModal {...defaultProps} />);

    expect(screen.getByText(/Calculated matching score/i)).toHaveTextContent('Calculated matching score: 85');
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('John D.')).toBeInTheDocument();
  });

  it('shows empty state when no differences', () => {
    const props = { ...defaultProps, comparisonResult: JSON.stringify({ score: 0, differences: [] }) };
    render(<LinkingStudyModal {...props} />);
    expect(screen.getByText('No comparison data available')).toBeInTheDocument();
  });

  it('calls closeModal when close button clicked', () => {
    render(<LinkingStudyModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('footer-close-button'));
    expect(closeModalMock).toHaveBeenCalled();
  });

  it('calls confirm API and shows success snackbar', async () => {
    (updateStudyLinkStatus as jest.Mock).mockResolvedValueOnce({});
    render(<LinkingStudyModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(updateStudyLinkStatus).toHaveBeenCalledWith(1, 123, expect.any(AbortController));
      expect(mutateMock).toHaveBeenCalled();
      expect(closeModalMock).toHaveBeenCalled();
      expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
    });
  });

  it('shows error snackbar on API failure', async () => {
    (updateStudyLinkStatus as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    render(<LinkingStudyModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'error',
          subtitle: 'API Error',
        }),
      );
    });
  });
});
