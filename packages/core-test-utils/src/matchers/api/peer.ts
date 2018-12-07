import * as _ from "lodash";

function isValidPeer(peer) {
  const allowedKeys = _.sortBy(["ip", "port"]);
  const actualKeys = Object.keys(peer).filter(key => allowedKeys.includes(key));

  return _.isEqual(_.sortBy(actualKeys), allowedKeys);
}

export default {
  toBeValidPeer: (actual, expected) => {
    return {
      message: () => `Expected ${JSON.stringify(actual)} to be a valid peer`,
      pass: isValidPeer(actual)
    };
  },

  toBeValidArrayOfPeers: (actual, expected) => {
    const message = () =>
      `Expected ${JSON.stringify(actual)} to be a valid array of peers`;

    if (!Array.isArray(actual)) {
      return { message, pass: false };
    }

    for (const peer of actual) {
      if (!isValidPeer(peer)) {
        return { message, pass: false };
      }
    }

    return { message, pass: true };
  }
};
