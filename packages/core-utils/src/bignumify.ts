import { Bignum } from "@arkecosystem/crypto";

export function bignumify(value) {
    return new Bignum(value);
}
