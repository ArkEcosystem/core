import { Interfaces } from "@arkecosystem/crypto";

export type ProcessorError = {
    type: string;
    message: string;
};

export interface Processor {
    accept: string[];
    broadcast: string[];
    invalid: string[];
    excess: string[];
    errors?: { [id: string]: ProcessorError };

    process(data: Interfaces.ITransactionData[]): Promise<void>;
}

export type ProcessorFactory = () => Processor;
