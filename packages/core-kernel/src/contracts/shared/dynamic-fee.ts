import { Interfaces } from "@arkecosystem/crypto";

export interface DynamicFeeContext {
    transaction: Interfaces.ITransaction;
    addonBytes: number;
    satoshiPerByte: number;
    height: number;
}
