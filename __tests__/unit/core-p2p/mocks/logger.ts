export const logger = {
    info: jest.fn().mockImplementation(console.log),
    warn: jest.fn().mockImplementation(console.log),
    error: jest.fn().mockImplementation(console.error),
    debug: jest.fn().mockImplementation(console.log),
};
