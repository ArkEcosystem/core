import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

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
    public async process(data: Interfaces.ITransactionData[]): Promise<void> {}

    public get accept(): string[] {
        return accept;
    }

    public get broadcast(): string[] {
        return broadcast;
    }

    public get invalid(): string[] {
        return invalid;
    }

    public get excess(): string[] {
        return excess;
    }

    public get errors(): any {
        return errors;
    }
}

export const instance = new TransactionPoolProcessorMock();
