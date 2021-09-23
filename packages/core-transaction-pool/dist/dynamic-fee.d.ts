import { Interfaces } from "@arkecosystem/crypto";
import { IDynamicFeeMatch } from "./interfaces";
export declare const dynamicFeeMatcher: (transaction: Interfaces.ITransaction) => Promise<IDynamicFeeMatch>;
