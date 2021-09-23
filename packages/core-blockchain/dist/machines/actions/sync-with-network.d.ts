export declare const syncWithNetwork: {
    initial: string;
    states: {
        syncing: {
            onEntry: string[];
            on: {
                SYNCED: string;
                NOTSYNCED: string;
                PAUSED: string;
                NETWORKHALTED: string;
            };
        };
        idle: {
            on: {
                DOWNLOADED: string;
            };
        };
        downloadBlocks: {
            onEntry: string[];
            on: {
                DOWNLOADED: string;
                NOBLOCK: string;
                PROCESSFINISHED: string;
            };
        };
        downloadFinished: {
            onEntry: string[];
            on: {
                PROCESSFINISHED: string;
            };
        };
        downloadPaused: {
            onEntry: string[];
            on: {
                PROCESSFINISHED: string;
            };
        };
        processFinished: {
            onEntry: string[];
            on: {
                SYNCED: string;
                NOTSYNCED: string;
            };
        };
        end: {
            onEntry: string[];
        };
    };
};
