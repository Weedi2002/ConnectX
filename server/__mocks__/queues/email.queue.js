export const emailQueue = { add: jest.fn().mockResolvedValue({ id: 'mock' }), close: jest.fn() };
export const emailWorker = { close: jest.fn(), on: jest.fn() };
export function addEmailJob(type, payload) { return emailQueue.add(type, payload); }
