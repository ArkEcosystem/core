import { Utils } from "@arkecosystem/crypto";

export function bignumify(value): Utils.Bignum {
    return new Utils.Bignum(value);
}
