export class Queue {
  constructor() {
    this.add = jest.fn().mockResolvedValue({ id: 'mock-job-id' });
    this.close = jest.fn().mockResolvedValue(undefined);
  }
}

export class Worker {
  constructor() {
    this.close = jest.fn().mockResolvedValue(undefined);
    this.on = jest.fn();
  }
}
