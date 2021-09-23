import { LoggerManager } from "./manager";
export declare const plugin: {
    pkg: any;
    alias: string;
    register(): Promise<LoggerManager>;
};
