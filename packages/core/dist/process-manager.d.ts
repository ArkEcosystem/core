import { Foreman, ProcessIdentifier } from "@typeskrift/foreman";
import { ExecaSyncReturnValue } from "execa";
declare class ProcessManager extends Foreman {
    restart(id: ProcessIdentifier): ExecaSyncReturnValue;
    list(): Array<Record<string, any>>;
}
export declare const processManager: ProcessManager;
export {};
