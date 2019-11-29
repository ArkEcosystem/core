import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { Blockchain } from "./blockchain";
import { blockchainMachine } from "./machines/blockchain";
import { ReplayBlockchain } from "./replay";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const blockchain: Blockchain = this.config().get("replay")
            ? this.app.resolve<any>(ReplayBlockchain).initialize()
            : this.app.resolve<Blockchain>(Blockchain);

        this.app.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);

        blockchain.initialize(this.config().all());

        this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).reset(blockchainMachine);
    }

    public async boot(): Promise<void> {
        await this.app.get<Blockchain>(Container.Identifiers.BlockchainService).boot();
    }

    public async dispose(): Promise<void> {
        await this.app.get<Blockchain>(Container.Identifiers.BlockchainService).dispose();
    }

    public async bootWhen(): Promise<boolean> {
        return !process.env.CORE_SKIP_BLOCKCHAIN && !this.config().has("replay");
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
