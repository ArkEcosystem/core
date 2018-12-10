import BigNumber from "bignumber.js";

// class Bignum extends BigNumber {
//   public static readonly ZERO = new BigNumber(0)
//   public static readonly ONE = new BigNumber(1)
// }

// Bignum.config({ DECIMAL_PLACES: 0 });

// export default Bignum

const Bignum: any = BigNumber.clone({ DECIMAL_PLACES: 0 });

Bignum.ZERO = new Bignum(0);
Bignum.ONE = new Bignum(1);

export { Bignum };
