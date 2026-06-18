import { apiDelete, apiPost } from '@/lib/api/client';

describe('api client csrf handling', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn();
  });

  function okJson(payload: unknown) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    } as unknown as Response;
  }

  it('attaches csrf token to unsafe requests', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return Promise.resolve(okJson({ data: { csrfToken: 'csrf-123' } }));
      }
      return Promise.resolve(okJson({ ok: true }));
    });

    await apiPost('/auth/login', { email: 'alice@example.com', password: 'securepass' });
    const requestInit = fetchMock.mock.calls[1][1] as RequestInit;

    expect(requestInit.headers).toMatchObject({
      'X-CSRFToken': 'csrf-123',
      'Content-Type': 'application/json',
    });
  });

  it('reuses csrf token for delete requests', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return Promise.resolve(okJson({ data: { csrfToken: 'csrf-123' } }));
      }
      return Promise.resolve(okJson({ ok: true }));
    });

    await apiDelete('/models/1/favorite');
    const requestInit = fetchMock.mock.calls[1][1] as RequestInit;

    expect(requestInit.headers).toMatchObject({
      'X-CSRFToken': 'csrf-123',
    });
  });
});
