import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnlinkStudyModal from './unlink-study.modal';
import { assignStudy, useStudiesByPatient } from '../../api';
import { showSnackbar } from '@openmrs/esm-framework';

// Mock translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  showSnackbar: jest.fn(),
}));

jest.mock('../../api', () => ({
  useStudiesByPatient: jest.fn(),
  assignStudy: jest.fn(),
}));

describe('UnlinkStudyModal', () => {
  const mockMutate = jest.fn();
  const mockClose = jest.fn();
  const studyId = 123;
  const patientUuid = 'patient-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
    (useStudiesByPatient as jest.Mock).mockReturnValue({ mutate: mockMutate });
  });

  it('renders correctly', () => {
    render(<UnlinkStudyModal closeUnlinkModal={mockClose} studyId={studyId} patientUuid={patientUuid} />);

    expect(screen.getByText(/Are you sure you want to unlink this study from the patient\?/i)).toBeInTheDocument();

    expect(screen.getByText('Unlink')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls assignStudy and handles success flow', async () => {
    (assignStudy as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<UnlinkStudyModal closeUnlinkModal={mockClose} studyId={studyId} patientUuid={patientUuid} />);

    fireEvent.click(screen.getByText('Unlink'));

    expect(assignStudy).toHaveBeenCalledWith(studyId, patientUuid, false, expect.any(AbortController));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    await waitFor(() => expect(mockClose).toHaveBeenCalled());
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' })));
  });

  it('handles error flow correctly', async () => {
    (assignStudy as jest.Mock).mockRejectedValueOnce(new Error('unlink failed'));

    render(<UnlinkStudyModal closeUnlinkModal={mockClose} studyId={studyId} patientUuid={patientUuid} />);

    fireEvent.click(screen.getByText('Unlink'));

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'error',
          subtitle: 'unlink failed',
        }),
      ),
    );
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('disables unlink button and shows loader while deleting', async () => {
    let resolvePromise: Function;

    const pendingPromise = new Promise((resolve) => (resolvePromise = resolve));
    (assignStudy as jest.Mock).mockReturnValue(pendingPromise);

    render(<UnlinkStudyModal closeUnlinkModal={mockClose} studyId={studyId} patientUuid={patientUuid} />);

    const unlinkButton = screen.getByRole('button', { name: /unlink/i });
    fireEvent.click(unlinkButton);

    expect(unlinkButton).toBeDisabled();
    expect(screen.getByText('Unlinking...')).toBeInTheDocument();

    resolvePromise({});
  });
});
