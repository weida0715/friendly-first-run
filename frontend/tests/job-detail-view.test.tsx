import { render, screen } from '@testing-library/react';

import { JobDetailView } from '@/views/JobDetailView';
import { ApiClientError, cancelJob, getJobDetail } from '@/lib/api/client';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'job-1' }),
}));

jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return {
    ...actual,
    getJobDetail: jest.fn(async () => ({
      ok: true,
      data: {
        job: {
          id: 'job-1',
          type: 'EXPERIMENT_EXECUTION',
          ownerId: 11,
          state: 'queued',
          queue: { position: 0 },
          worker: { name: null },
        },
      },
    })),
    cancelJob: jest.fn(async () => ({ ok: true, data: { job: { id: 'job-1', state: 'canceled', cancelled: true } } })),
  };
});

const mockGetJobDetail = getJobDetail as unknown as jest.Mock;
const mockCancelJob = cancelJob as unknown as jest.Mock;

describe('JobDetailView', () => {
  it('renders fetched job detail data', async () => {
    render(<JobDetailView />);

    expect(screen.getByText('Job Detail')).toBeInTheDocument();
    expect(await screen.findByText('job-1')).toBeInTheDocument();
    expect(await screen.findByText('EXPERIMENT_EXECUTION')).toBeInTheDocument();
    expect(await screen.findByText('11')).toBeInTheDocument();
  });

  it('shows friendly message when job is not found', async () => {
    mockGetJobDetail.mockRejectedValueOnce(new ApiClientError('Job not found', 404));
    render(<JobDetailView />);
    expect(await screen.findByText('Job not found or no longer available.')).toBeInTheDocument();
  });
});
