import { Bignum } from "./utils";

export interface MultiPaymentItem {
    amount: Bignum;
    recipientId: string;
}
