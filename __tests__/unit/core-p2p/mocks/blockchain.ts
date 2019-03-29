import { database } from "./database";

export const blockchain = {
    getLastBlock: jest.fn().mockReturnValue({ data: { height: 1, timestamp: 222 }, getHeader: () => ({}) }),
    getLastDownloadedBlock: jest.fn(),
    forceWakeup: jest.fn(),
    handleIncomingBlock: jest.fn(),
    getUnconfirmedTransactions: jest.fn().mockReturnValue([]),
    pingBlock: jest.fn().mockReturnValue(false),
    pushPingBlock: jest.fn(),
    getBlockPing: jest.fn(),

    database,
};
