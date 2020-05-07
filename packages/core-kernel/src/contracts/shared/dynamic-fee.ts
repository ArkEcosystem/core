import { Interfaces } from "@arkecosystem/crypto";

export interface DynamicFeeContext {
    transaction: Interfaces.ITransaction<Interfaces.ITransactionData>;
    addonBytes: number;
    satoshiPerByte: number;
    height: number;
}
