import * as _ from "lodash";

export default {
  toBeWallet: actual => {
    return {
      message: () => "Expected value to be a valid wallet",
      pass: _.isEqual(_.sortBy(Object.keys(actual)), ["address", "publicKey"])
    };
  }
};
