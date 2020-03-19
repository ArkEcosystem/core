import { Contracts } from "@packages/core-kernel";


let accept: string[] = [];
let broadcast: string[] = [];
let invalid: string[] = [];
let excess: string[] = [];
let errors: { [id: string]: Contracts.TransactionPool.ProcessorError } | undefined;

export const setProcessorState = (state: any): void => {
    accept = state.accept ? state.accept : [];
    broadcast = state.broadcast ? state.broadcast : [];
    broadcast = state.broadcast ? state.broadcast : [];
    invalid = state.invalid ? state.invalid : [];
    excess = state.excess ? state.excess : [];
    errors = state.errors ? state.errors : [];
};

export const transactionPoolProcessor: Partial<Contracts.TransactionPool.Processor> = {
    process: async (data: any) : Promise<void> => {
        return;
    },
    get accept(): string[] {
        return accept
    },
    get broadcast(): string[] {
        return broadcast
    },
    get invalid(): string[] {
      return invalid
    },
    get excess(): string[] {
        return excess
    },
    get errors(): any {
        return errors
    }
};
