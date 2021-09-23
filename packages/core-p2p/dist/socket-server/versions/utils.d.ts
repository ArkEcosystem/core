export declare const isAppReady: () => {
    ready: boolean;
};
export declare const getHandlers: () => {
    [key: string]: string[];
};
export declare const log: ({ req }: {
    req: any;
}) => void;
export declare const isForgerAuthorized: ({ req }: {
    req: any;
}) => {
    authorized: boolean;
};
export declare const getConfig: () => Record<string, any>;
