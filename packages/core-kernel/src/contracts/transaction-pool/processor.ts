import { Interfaces } from "@arkecosystem/crypto";

export type ProcessorError = {
    type: string;
    message: string;
};

export type ProcessorResult = {
    accept: string[];
    broadcast: string[];
    invalid: string[];
    excess: string[];
    errors?: { [id: string]: ProcessorError };
};

export interface ProcessorExtension {
    throwIfCannotBroadcast(transaction: Interfaces.ITransaction): Promise<void>;
}

export interface ProcessorDynamicFeeExtension extends ProcessorExtension {}

export interface Processor {
    process(data: Interfaces.ITransactionData[] | Buffer[]): Promise<ProcessorResult>;
}

export type ProcessorFactory = () => Processor;
