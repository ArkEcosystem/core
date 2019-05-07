import { Foreman, ProcessIdentifier } from "@faustbrian/foreman";
import { ExecaReturns } from "execa";

class ProcessManager extends Foreman {
    public restart(id: ProcessIdentifier): ExecaReturns {
        return super.restart(id, ["--update-env"]);
    }
}

export const processManager = new ProcessManager();
