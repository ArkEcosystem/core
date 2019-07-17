import { Foreman, ProcessIdentifier } from "@typeskrift/foreman";
import { ExecaSyncReturnValue } from "execa";

class ProcessManager extends Foreman {
    public restart(id: ProcessIdentifier): ExecaSyncReturnValue {
        return super.restart(id, { "update-env": true });
    }

    public list(): Array<Record<string, any>> {
        return super.list() || [];
    }
}

export const processManager = new ProcessManager();
