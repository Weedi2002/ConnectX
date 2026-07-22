export const notificationQueue = { add: jest.fn().mockResolvedValue({ id: 'mock' }), close: jest.fn() };
export const notificationWorker = { close: jest.fn(), on: jest.fn() };
export function addNotificationJob(type, payload) { return notificationQueue.add(type, payload); }
