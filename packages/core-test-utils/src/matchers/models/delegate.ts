import * as _ from "lodash";

export default {
  toBeDelegate: actual => {
    return {
      message: () => "Expected value to be a valid delegate",
      pass: _.isEqual(_.sortBy(Object.keys(actual)), [
        "address",
        "publicKey",
        "username"
      ])
    };
  }
};
