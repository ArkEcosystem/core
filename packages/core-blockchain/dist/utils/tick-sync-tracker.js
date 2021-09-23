"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
let tracker;
exports.tickSyncTracker = (blockCount, count) => {
    if (!tracker) {
        tracker = {
            start: new Date().getTime(),
            networkHeight: core_container_1.app
                .resolvePlugin("p2p")
                .getMonitor()
                .getNetworkHeight(),
            blocksInitial: +count,
            blocksDownloaded: +count,
            blocksSession: 0,
            blocksPerMillisecond: 0,
            remainingInMilliseconds: 0,
            percent: 0,
        };
    }
    // The total amount of downloaded blocks equals the current height
    tracker.blocksDownloaded += +blockCount;
    // The total amount of downloaded blocks downloaded since start of the current session
    tracker.blocksSession = tracker.blocksDownloaded - tracker.blocksInitial;
    // The number of blocks the node can download per millisecond
    const diffSinceStart = new Date().getTime() - tracker.start;
    tracker.blocksPerMillisecond = tracker.blocksSession / diffSinceStart;
    // The time left to download the missing blocks in milliseconds
    tracker.remainingInMilliseconds = (tracker.networkHeight - tracker.blocksDownloaded) / tracker.blocksPerMillisecond;
    tracker.remainingInMilliseconds = Math.abs(Math.trunc(tracker.remainingInMilliseconds));
    // The percentage of total blocks that has been downloaded
    tracker.percent = (tracker.blocksDownloaded * 100) / tracker.networkHeight;
    if (tracker.percent < 100 && Number.isFinite(tracker.remainingInMilliseconds)) {
        const blocksDownloaded = tracker.blocksDownloaded.toLocaleString();
        const networkHeight = tracker.networkHeight.toLocaleString();
        const timeLeft = pretty_ms_1.default(tracker.remainingInMilliseconds, {
            secondsDecimalDigits: 0,
        });
        core_container_1.app.resolvePlugin("logger").info(`Synchronising In Progress (${blocksDownloaded} of ${networkHeight} blocks - Est. ${timeLeft})`);
    }
    if (tracker.percent === 100) {
        tracker = undefined;
    }
};
//# sourceMappingURL=tick-sync-tracker.js.map