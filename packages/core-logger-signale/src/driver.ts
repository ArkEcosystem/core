import { Contracts, Services } from "@arkecosystem/core-kernel";
import { Signale } from "signale";

export class SignaleLogger extends Services.Log.Logger implements Contracts.Kernel.Log.Logger {
    public constructor(private readonly opts: any) {
        super();
    }

    public async make(): Promise<Contracts.Kernel.Log.Logger> {
        this.setLevels({
            verbose: "note",
        });

        this.logger = new Signale(this.opts);

        return this;
    }
}
