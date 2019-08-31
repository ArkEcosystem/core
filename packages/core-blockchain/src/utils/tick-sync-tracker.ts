import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import prettyMs from "pretty-ms";

let tracker;

export const tickSyncTracker = (blockCount, count): void => {
    if (!tracker) {
        tracker = {
            start: new Date().getTime(),
            networkHeight: app
                .get<Contracts.P2P.PeerService>(Container.Identifiers.PeerService)
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
        const timeLeft = prettyMs(tracker.remainingInMilliseconds, {
            secondsDecimalDigits: 0,
        });

        app.log.info(`Synchronising In Progress (${blocksDownloaded} of ${networkHeight} blocks - Est. ${timeLeft})`);
    }

    if (tracker.percent === 100) {
        tracker = undefined;
    }
};
