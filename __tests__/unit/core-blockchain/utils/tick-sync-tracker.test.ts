const info = jest.fn();
jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => ({
                info,
                getMonitor: () => ({ getNetworkHeight: () => 120 }),
            }),
        },
    };
});

let tickSyncTracker;
const DateBackup = Date;

describe("tickSyncTracker", () => {
    beforeEach(() => {
        global.Date = DateBackup;
        tickSyncTracker = require("../../../../packages/core-blockchain/src/utils").tickSyncTracker;
    });

    it("print tracker stats when percent < 100", () => {
        const now = new Date();
        const nowMinus8Ms = new Date();
        nowMinus8Ms.setMilliseconds(now.getMilliseconds() - 8);

        // mocking Date to return nowMinus8Ms then now
        global.Date = jest
            .fn()
            .mockImplementationOnce(() => nowMinus8Ms)
            .mockImplementationOnce(() => now) as any;
        global.Date.UTC = DateBackup.UTC;
        global.Date.parse = DateBackup.parse;
        global.Date.now = DateBackup.now;

        tickSyncTracker(8, 52);

        expect(info).toHaveBeenLastCalledWith("Synchronising In Progress (60 of 120 blocks - Est. 60ms)");
    });

    it("should stop tracker when percent == 100", () => {
        tickSyncTracker(60, 60); // should set tracker = null, so when we call again tickSyncTracker it is reset

        const now = new Date();
        const nowMinus8Ms = new Date();
        nowMinus8Ms.setMilliseconds(now.getMilliseconds() - 8);

        // mocking Date to return nowMinus8Ms then now
        global.Date = jest
            .fn()
            .mockImplementationOnce(() => nowMinus8Ms)
            .mockImplementationOnce(() => now) as any;
        global.Date.UTC = DateBackup.UTC;
        global.Date.parse = DateBackup.parse;
        global.Date.now = DateBackup.now;

        tickSyncTracker(8, 12);

        expect(info).toHaveBeenLastCalledWith("Synchronising In Progress (20 of 120 blocks - Est. 100ms)");
    });
});
