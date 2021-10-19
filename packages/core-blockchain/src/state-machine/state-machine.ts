import { Container, Contracts } from "@arkecosystem/core-kernel";

import { actions } from "./actions";
import { Action } from "./contracts";
import { blockchainMachine } from "./machine";

@Container.injectable()
export class StateMachine {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    /**
     * Dispatch an event to transition the state machine.
     *
     * @param  {String} event
     * @return {void}
     */
    public transition(event) {
        const nextState = blockchainMachine.transition(this.stateStore.getBlockchain(), event);

        if (nextState.actions.length > 0) {
            this.logger.debug(
                `event '${event}': ${JSON.stringify(this.stateStore.getBlockchain().value)} -> ${JSON.stringify(
                    nextState.value,
                )} -> actions: [${nextState.actions.map((a) => a.type).join(", ")}]`,
            );
        } else {
            this.logger.debug(
                `event '${event}': ${JSON.stringify(this.stateStore.getBlockchain().value)} -> ${JSON.stringify(
                    nextState.value,
                )}`,
            );
        }

        this.stateStore.setBlockchain(nextState);

        for (const actionKey of nextState.actions.map((action) => action.type)) {
            let action: Action;
            try {
                action = this.app.resolve(actions[actionKey]);
            } catch {}

            // @ts-ignore
            if (action) {
                setImmediate(() => action.handle());
            } else {
                this.logger.error(`No action '${actionKey}' found`);
            }
        }

        return nextState;
    }

    public getState(): string | undefined {
        return this.stateStore.getBlockchain().value;
    }
}
