import { Bignum } from "@arkecosystem/crypto";

function bignumify(value) {
    return new Bignum(value);
}

export { bignumify };
