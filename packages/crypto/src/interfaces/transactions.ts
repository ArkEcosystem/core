import { Bignum } from "../utils";

export interface MultiPaymentItem {
    amount: Bignum;
    recipientId: string;
}

export interface ISerializeOptions {
    excludeSignature?: boolean;
    excludeSecondSignature?: boolean;
}
