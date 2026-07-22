export const mediaQueue = { add: jest.fn().mockResolvedValue({ id: 'mock' }), close: jest.fn() };
export const mediaWorker = { close: jest.fn(), on: jest.fn() };
export function addMediaJob(attachment, messageId) { return mediaQueue.add('process', { attachment, messageId }); }
