import { Contracts } from "@arkecosystem/core-kernel";
import { Signale } from "signale";

export class SignaleLogger extends AbstractLogger {
    protected logger: Signale;

    public make(): Contracts.Kernel.ILogger {
        this.logger = new Signale(this.options);

        return this;
    }

    protected getLevels(): Record<string, string> {
        return {
            verbose: "note",
        };
    }
}
