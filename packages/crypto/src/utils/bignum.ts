import BigNumber from "bignumber.js";

class Bignum extends BigNumber {
    public static readonly ZERO = new BigNumber(0);
    public static readonly ONE = new BigNumber(1);
}

Bignum.config({ DECIMAL_PLACES: 0 });

export { Bignum };
