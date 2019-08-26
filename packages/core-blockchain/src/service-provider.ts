import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { Blockchain } from "./blockchain";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        const blockchain: Blockchain = this.config().get("replay")
            ? new ReplayBlockchain()
            : new Blockchain(this.config().all());

        this.app
            .get<Contracts.State.IStateService>("state")
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !this.config().get("replay")) {
            await blockchain.start();
        }

        this.app.bind("blockchain").toConstantValue(blockchain);
        this.app.bind("blockchain.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        await this.app.get<Blockchain>("blockchain").stop();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
