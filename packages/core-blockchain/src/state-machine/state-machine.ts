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
        const nextState = blockchainMachine.transition(this.stateStore.blockchain, event);

        if (nextState.actions.length > 0) {
            this.logger.debug(
                `event '${event}': ${JSON.stringify(this.stateStore.blockchain.value)} -> ${JSON.stringify(
                    nextState.value,
                )} -> actions: [${nextState.actions.map(a => a.type).join(", ")}]`,
            );
        } else {
            this.logger.debug(
                `event '${event}': ${JSON.stringify(this.stateStore.blockchain.value)} -> ${JSON.stringify(
                    nextState.value,
                )}`,
            );
        }

        this.stateStore.blockchain = nextState;

        for (const actionKey of nextState.actions) {
            const action: Action = this.app.resolve(actions[actionKey]);

            if (action) {
                setImmediate(() => action.handle());
            } else {
                this.logger.error(`No action '${actionKey}' found`);
            }
        }

        return nextState;
    }
}
