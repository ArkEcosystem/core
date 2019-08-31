import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { Blockchain } from "./blockchain";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const blockchain: Blockchain = this.config().get("replay")
            ? new ReplayBlockchain()
            : new Blockchain(this.config().all());

        this.app
            .get<Contracts.State.StateService>(Container.Identifiers.StateService)
            .getStore()
            .reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !this.config().get("replay")) {
            await blockchain.start();
        }

        this.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        this.app.bind("blockchain.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        await this.app.get<Blockchain>(Container.Identifiers.BlockchainService).stop();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
