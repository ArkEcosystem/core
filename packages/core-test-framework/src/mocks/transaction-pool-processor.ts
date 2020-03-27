import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@packages/crypto";

let accept: string[] = [];
let broadcast: string[] = [];
let invalid: string[] = [];
let excess: string[] = [];
let errors: { [id: string]: Contracts.TransactionPool.ProcessorError } | undefined = undefined;

export const setProcessorState = (state: any): void => {
    accept = state.accept ? state.accept : [];
    broadcast = state.broadcast ? state.broadcast : [];
    broadcast = state.broadcast ? state.broadcast : [];
    invalid = state.invalid ? state.invalid : [];
    excess = state.excess ? state.excess : [];
    errors = state.errors ? state.errors : undefined;
};

class TransactionPoolProcessorMock implements Partial<Contracts.TransactionPool.Processor> {
    async process(data: Interfaces.ITransactionData[]): Promise<void> {}

    get accept(): string[] {
        return accept;
    }

    get broadcast(): string[] {
        return broadcast;
    }

    get invalid(): string[] {
        return invalid;
    }

    get excess(): string[] {
        return excess;
    }

    get errors(): any {
        return errors;
    }
}

export const instance = new TransactionPoolProcessorMock();
