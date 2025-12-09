import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpdateProcedureStepStatusModal from './update-procedureStep-status.modal';
import { updateProcedureStepStatus } from '../../api';
import { showSnackbar } from '@openmrs/esm-framework';

jest.mock('../../api', () => ({
  updateProcedureStepStatus: jest.fn(),
}));

jest.mock('@openmrs/esm-framework', () => ({
  showSnackbar: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultText: string) => defaultText,
  }),
}));

describe('UpdateProcedureStepStatusModal', () => {
  const closeMock = jest.fn();
  const stepId = 1;
  const status = 'rejected';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal text correctly', () => {
    render(<UpdateProcedureStepStatusModal closeChangeStepStatusModel={closeMock} stepId={stepId} status={status} />);

    expect(screen.getByText('Update procedure step')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to change this procedure step?')).toBeInTheDocument();
    expect(screen.getByText('You need to create a new procedure step to renew the rejected step!')).toBeInTheDocument();
  });

  test('clicking Cancel calls closeChangeStepStatusModel', () => {
    render(<UpdateProcedureStepStatusModal closeChangeStepStatusModel={closeMock} stepId={stepId} status={status} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test('submitting calls updateProcedureStepStatus and shows success snackbar', async () => {
    (updateProcedureStepStatus as jest.Mock).mockResolvedValue({});

    render(<UpdateProcedureStepStatusModal closeChangeStepStatusModel={closeMock} stepId={stepId} status={status} />);

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => {
      expect(updateProcedureStepStatus).toHaveBeenCalledWith(status, stepId, expect.any(AbortController));
    });
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  test('shows error snackbar on failure', async () => {
    (updateProcedureStepStatus as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

    render(<UpdateProcedureStepStatusModal closeChangeStepStatusModel={closeMock} stepId={stepId} status={status} />);

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'error',
          subtitle: 'Update failed',
        }),
      );
    });
    expect(closeMock).not.toHaveBeenCalled();
  });
});
