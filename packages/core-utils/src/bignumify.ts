import { Utils } from "@arkecosystem/crypto";

export function bignumify(value) {
    return new Utils.Bignum(value);
}
