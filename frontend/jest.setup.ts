import '@testing-library/jest-dom';

if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: {
      get: () => 'application/json',
    },
    json: async () => ({ ok: true, data: {} }),
  }) as unknown as typeof fetch;
}
