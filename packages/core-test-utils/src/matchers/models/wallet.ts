import * as _ from "lodash";

export { }

declare global {
  namespace jest {
    // tslint:disable-next-line:interface-name
    interface Matchers<R> {
      toBeWallet(): R;
    }
  }
}

expect.extend({
  toBeWallet: actual => {
    return {
      message: () => "Expected value to be a valid wallet",
      pass: _.isEqual(_.sortBy(Object.keys(actual)), ["address", "publicKey"])
    };
  }
})
