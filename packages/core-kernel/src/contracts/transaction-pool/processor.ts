import { Interfaces } from "@arkecosystem/crypto";

export type ProcessorError = {
    type: string;
    message: string;
};

export interface Processor {
    process(data: Interfaces.ITransactionData[] | Buffer[]): Promise<{
        accept: string[],
        broadcast: string[],
        invalid: string[],
        excess: string[],
        errors?: { [id: string]: ProcessorError },
    }>;
}

export type ProcessorFactory = () => Processor;
