import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Blockchain } from "./blockchain";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const blockchain: Blockchain = this.config().get("replay")
            ? new ReplayBlockchain()
            : new Blockchain(this.config().all());

        this.ioc
            .get<Contracts.State.IStateService>("state")
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !this.config().get("replay")) {
            await blockchain.start();
        }

        this.ioc.bind("blockchain").toConstantValue(blockchain);
        this.ioc.bind("blockchain.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        await this.ioc.get<Blockchain>("blockchain").stop();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
