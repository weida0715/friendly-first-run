import { render, screen } from '@testing-library/react';

import { SystemManagementView } from '@/views/SystemManagementView';
import { getSystemEventsDownloadUrl } from '@/lib/api/client';

const getActiveQueueSnapshotMock = jest.fn();
const getSystemSettingsMock = jest.fn();
const getSystemEventsMock = jest.fn();
const updateSystemSettingsMock = jest.fn();

jest.mock('@/lib/api/client', () => ({
  ...jest.requireActual('@/lib/api/client'),
  getActiveQueueSnapshot: (...args: unknown[]) => getActiveQueueSnapshotMock(...args),
  getSystemEvents: (...args: unknown[]) => getSystemEventsMock(...args),
  getSystemSettings: (...args: unknown[]) => getSystemSettingsMock(...args),
  updateSystemSettings: (...args: unknown[]) => updateSystemSettingsMock(...args),
}));

describe('SystemManagementView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders queue snapshot cards and jobs rows', async () => {
    getActiveQueueSnapshotMock.mockResolvedValueOnce({
      ok: true,
      data: {
        queue: {
          queue_depth: 2,
          running_jobs: 1,
          active_jobs_total: 3,
          active_jobs: [
            { job_id: 'job-1', state: 'queued', position: 0, queue_name: 'experiments' },
            { job_id: 'job-2', state: 'running', position: null, queue_name: 'experiments' },
          ],
        },
      },
    });
    getSystemSettingsMock.mockResolvedValueOnce({ ok: true, data: { settings: { queue_job_timeout_seconds: 7200, max_requested_permutations: 250, max_round_log_rows: 0 }, metadata: [] } });
    getSystemEventsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<SystemManagementView />);

    expect(await screen.findByText('System Management')).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(await screen.findByText('job-1')).toBeInTheDocument();
    expect(await screen.findByText('job-2')).toBeInTheDocument();
  });

  it('renders empty state when queue has no active jobs', async () => {
    getActiveQueueSnapshotMock.mockResolvedValueOnce({
      ok: true,
      data: {
        queue: {
          queue_depth: 0,
          running_jobs: 0,
          active_jobs_total: 0,
          active_jobs: [],
        },
      },
    });
    getSystemSettingsMock.mockResolvedValueOnce({ ok: true, data: { settings: { queue_job_timeout_seconds: 7200, max_requested_permutations: 250, max_round_log_rows: 0 }, metadata: [] } });
    getSystemEventsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<SystemManagementView />);
    expect(await screen.findByText('No queued jobs')).toBeInTheDocument();
  });

  it('renders editable system settings controls', async () => {
    getActiveQueueSnapshotMock.mockResolvedValueOnce({ ok: true, data: { queue: { queue_depth: 0, running_jobs: 0, active_jobs_total: 0, active_jobs: [] } } });
    getSystemSettingsMock.mockResolvedValueOnce({ ok: true, data: { settings: { queue_job_timeout_seconds: 7200, max_requested_permutations: 250, max_round_log_rows: 0 }, metadata: [] } });
    getSystemEventsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<SystemManagementView />);

    expect(await screen.findByPlaceholderText('Queue job timeout seconds')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Max requested permutations')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Max round log rows')).toBeInTheDocument();
  });

  it('truncates the terminal to 1000 rows and exposes the download link', async () => {
    const items = Array.from({ length: 5005 }).map((_, index) => ({
      id: index + 1,
      scope: index % 2 === 0 ? 'auth' : 'user',
      action: `Event ${index + 1}`,
      actor: 'admin',
      message: `message ${index + 1}`,
      createdAt: `2026-06-19T00:00:${String(index % 60).padStart(2, '0')}Z`,
    }));
    getActiveQueueSnapshotMock.mockResolvedValueOnce({ ok: true, data: { queue: { queue_depth: 0, running_jobs: 0, active_jobs_total: 0, active_jobs: [] } } });
    getSystemSettingsMock.mockResolvedValueOnce({ ok: true, data: { settings: { queue_job_timeout_seconds: 7200, max_requested_permutations: 250, max_round_log_rows: 0 }, metadata: [] } });
    getSystemEventsMock.mockResolvedValueOnce({ ok: true, data: { items } });

    render(<SystemManagementView />);

    expect(await screen.findByText('Event 1')).toBeInTheDocument();
    expect(screen.queryByText('Event 5001')).not.toBeInTheDocument();
    expect(screen.getByText('Download Log').closest('a')).toHaveAttribute('href', getSystemEventsDownloadUrl());
  });
});
