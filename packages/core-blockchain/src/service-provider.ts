import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { Blockchain } from "./blockchain";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("blockchain.options").toConstantValue(this.config().all());

        // blockchain
        const blockchain: Blockchain = this.config().get("replay")
            ? new ReplayBlockchain()
            : this.app.resolve<Blockchain>(Blockchain);

        this.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);

        blockchain.init(this.config().all());

        // state
        this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).reset(blockchainMachine);

        if (!process.env.CORE_SKIP_BLOCKCHAIN && !this.config().get("replay")) {
            await blockchain.start();
        }
    }

    public async dispose(): Promise<void> {
        await this.app.get<Blockchain>(Container.Identifiers.BlockchainService).stop();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
