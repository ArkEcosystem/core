import BigNumberJS from "bignumber.js";

class BigNumber extends BigNumberJS {
    public static readonly ZERO = new BigNumberJS(0);
    public static readonly ONE = new BigNumberJS(1);
    public static readonly SATOSHI = new BigNumberJS(1e8);

    public static make(value: string | number): BigNumber {
        return new BigNumber(value);
    }
}

BigNumber.config({ DECIMAL_PLACES: 0 });

export { BigNumber };
