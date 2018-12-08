import Keys from "./keys";

export default class PrivateKey {
  public static fromPassphrase(passphrase) {
    return Keys.fromPassphrase(passphrase).privateKey;
  }

  // static fromHex (privateKey) {}

  public static fromWIF(wif, network) {
    return Keys.fromWIF(wif, network).privateKey;
  }
};
