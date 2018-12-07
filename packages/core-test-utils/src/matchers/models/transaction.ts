import * as _ from "lodash";

export default {
  toBeTransaction: actual => {
    // TODO based on type
    const allowedKeys = _.sortBy([
      "id",
      "type",
      "amount",
      "fee",
      "timestamp",
      "signature"
    ]);
    const actualKeys = Object.keys(actual).filter(key =>
      allowedKeys.includes(key)
    );

    return {
      message: () => "Expected value to be a valid transaction",
      pass: _.isEqual(_.sortBy(actualKeys), allowedKeys)
    };
  }
};
