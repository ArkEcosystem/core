import { IConfig } from "@oclif/config";
export declare const installFromChannel: (pkg: any, channel: any) => Promise<void>;
export declare const getRegistryChannel: (config: IConfig) => string;
export declare const needsRefresh: (config: IConfig) => boolean;
export declare const checkForUpdates: ({ config, error, warn }: {
    config: any;
    error: any;
    warn: any;
}) => Promise<any>;
