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
    public async process(data: Interfaces.ITransactionData[] | Buffer[]): Promise<{
        accept: string[],
        broadcast: string[],
        invalid: string[],
        excess: string[],
        errors?: { [id: string]: Contracts.TransactionPool.ProcessorError },
    }> {
        return {
            accept,
            broadcast,
            invalid,
            excess,
            errors,
        }
    }
}

export const instance = new TransactionPoolProcessorMock();
