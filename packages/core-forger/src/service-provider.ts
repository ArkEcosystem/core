import { Container, Contracts, Enums, Providers, Services } from "@arkecosystem/core-kernel";
import Joi from "joi";

import { ForgeNewBlockAction, IsForgingAllowedAction } from "./actions";
import { DelegateFactory } from "./delegate-factory";
import { DelegateTracker } from "./delegate-tracker";
import { ForgerService } from "./forger-service";
import { Delegate } from "./interfaces";
import { CurrentDelegateProcessAction, LastForgedBlockRemoteAction, NextSlotProcessAction } from "./process-actions";

/**
 * @export
 * @class ServiceProvider
 * @extends {Providers.ServiceProvider}
 */
export class ServiceProvider extends Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.bind<ForgerService>(Container.Identifiers.ForgerService).to(ForgerService).inSingletonScope();

        this.registerActions();

        this.registerProcessActions();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        const delegates: Delegate[] = this.makeDelegates();

        const forgerService = this.app.get<ForgerService>(Container.Identifiers.ForgerService);

        forgerService.register(this.config().all());
        await forgerService.boot(delegates);

        this.startTracker(delegates);

        // // Don't keep bip38 password in memory
        // this.config().set("app.flags.bip38", undefined);
        // this.config().set("app.flags.password", undefined);
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async dispose(): Promise<void> {
        await this.app.get<ForgerService>(Container.Identifiers.ForgerService).dispose();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async bootWhen(): Promise<boolean> {
        const { secrets, bip38 }: { secrets: string[]; bip38: string } = this.app.config("delegates")!;

        if (!bip38 && (!secrets || !secrets.length || !Array.isArray(secrets))) {
            return false;
        }

        return true;
    }

    public configSchema(): object {
        return Joi.object({
            hosts: Joi.array()
                .items(
                    Joi.object({
                        hostname: Joi.string()
                            .ip({
                                version: ["ipv4", "ipv6"],
                            })
                            .required(),
                        port: Joi.number().integer().min(1).max(65535).required(),
                    }),
                )
                .required(),
            tracker: Joi.bool().required(),
            bip38: Joi.string(),
            password: Joi.string(),
        }).unknown(true);
    }

    private registerActions(): void {
        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("forgeNewBlock", new ForgeNewBlockAction());

        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("isForgingAllowed", new IsForgingAllowedAction());
    }

    private registerProcessActions(): void {
        this.app
            .get<Contracts.Kernel.ProcessActionsService>(Container.Identifiers.ProcessActionsService)
            .register(this.app.resolve(CurrentDelegateProcessAction));

        this.app
            .get<Contracts.Kernel.ProcessActionsService>(Container.Identifiers.ProcessActionsService)
            .register(this.app.resolve(NextSlotProcessAction));

        this.app
            .get<Contracts.Kernel.ProcessActionsService>(Container.Identifiers.ProcessActionsService)
            .register(this.app.resolve(LastForgedBlockRemoteAction));
    }

    /**
     * @private
     * @memberof ServiceProvider
     */
    private startTracker(delegates: Delegate[]): void {
        if (!Array.isArray(delegates) || !delegates.length) {
            return;
        }

        if (this.config().get("tracker") === true) {
            this.app
                .get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService)
                .listen(
                    Enums.BlockEvent.Applied,
                    this.app.resolve<DelegateTracker>(DelegateTracker).initialize(delegates),
                );
        }
    }

    /**
     * @private
     * @returns {Delegate[]}
     * @memberof ServiceProvider
     */
    private makeDelegates(): Delegate[] {
        const delegates: Set<Delegate> = new Set<Delegate>();

        for (const secret of this.app.config("delegates.secrets")) {
            delegates.add(DelegateFactory.fromBIP39(secret));
        }

        const { bip38, password } = this.app.config("app.flags")!;

        if (bip38) {
            delegates.add(DelegateFactory.fromBIP38(bip38, password));
        }

        return [...delegates];
    }
}
