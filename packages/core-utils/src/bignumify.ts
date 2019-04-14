import { Utils } from "@arkecosystem/crypto";

// @TODO: remove this
export function bignumify(value): Utils.Bignum {
    return new Utils.Bignum(value);
}
