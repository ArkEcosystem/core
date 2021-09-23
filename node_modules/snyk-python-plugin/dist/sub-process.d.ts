/// <reference types="node" />
import { SpawnOptions } from 'child_process';
interface ProcessOptions {
    cwd?: string;
    env?: {
        [name: string]: string;
    };
}
export declare function execute(command: string, args: string[], options?: ProcessOptions): Promise<string>;
export declare function executeSync(command: string, args: string[], options?: SpawnOptions): import("child_process").SpawnSyncReturns<Buffer>;
export {};
