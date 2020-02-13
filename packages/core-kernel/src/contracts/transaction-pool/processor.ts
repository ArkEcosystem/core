import { Interfaces } from "@arkecosystem/crypto";

export interface Processor {
    accept: string[];
    broadcast: string[];
    excess: string[];
    invalid: string[];
    errors: string[] | undefined;

    process(transactions: Interfaces.ITransaction[]): Promise<void>;
}

export type ProcessorFactory = () => Processor;
