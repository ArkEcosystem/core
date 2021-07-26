import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import Joi from "joi";

import { ProcessBlockAction } from "./actions";
import { Blockchain } from "./blockchain";
import { BlockProcessor } from "./processor";
import { StateMachine } from "./state-machine";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Container.Identifiers.StateMachine).to(StateMachine).inSingletonScope();
        this.app.bind(Container.Identifiers.BlockchainService).to(Blockchain).inSingletonScope();
        this.app.bind(Container.Identifiers.BlockProcessor).to(BlockProcessor).inSingletonScope();

        this.registerActions();
    }

    public async boot(): Promise<void> {
        await this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).boot();
    }

    public async dispose(): Promise<void> {
        await this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).dispose();
    }

    public async required(): Promise<boolean> {
        return true;
    }

    public configSchema(): object {
        return Joi.object({
            databaseRollback: Joi.object({
                maxBlockRewind: Joi.number().integer().min(1).required(),
                steps: Joi.number().integer().min(1).required(),
            }).required(),

            // used in core:run & relay:run
            networkStart: Joi.bool(),
        }).unknown(true);
    }

    private registerActions(): void {
        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("processBlock", new ProcessBlockAction());
    }
}
