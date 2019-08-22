import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { Blockchain } from "./blockchain";
import { defaults } from "./defaults";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const blockchain: Blockchain = this.opts.replay ? new ReplayBlockchain() : new Blockchain(this.opts);

        this.app
            .resolve<Contracts.State.IStateService>("state")
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !this.opts.replay) {
            await blockchain.start();
        }

        this.app.bind("blockchain", blockchain);
        this.app.bind("blockchain.options", this.opts);
    }

    public async dispose(): Promise<void> {
        await this.app.resolve<Blockchain>("blockchain").stop();
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public defaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["blockchain"];
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
