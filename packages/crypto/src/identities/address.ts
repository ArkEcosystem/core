import bs58check from "bs58check";
import utils from "../crypto/utils";
import configManager from "../managers/config";
import PublicKey from "./public-key";

export default class Address {
  public static fromPassphrase(passphrase, networkVersion) {
    return Address.fromPublicKey(
      PublicKey.fromPassphrase(passphrase),
      networkVersion
    );
  }

  public static fromPublicKey(publicKey, networkVersion) {
    const pubKeyRegex = /^[0-9A-Fa-f]{66}$/;
    if (!pubKeyRegex.test(publicKey)) {
      throw new Error(`publicKey '${publicKey}' is invalid`);
    }

    if (!networkVersion) {
      networkVersion = configManager.get("pubKeyHash");
    }

    const buffer = utils.ripemd160(Buffer.from(publicKey, "hex"));
    const payload = Buffer.alloc(21);

    payload.writeUInt8(networkVersion, 0);
    buffer.copy(payload, 1);

    return bs58check.encode(payload);
  }

  public static fromPrivateKey(privateKey, networkVersion) {
    return Address.fromPublicKey(privateKey.publicKey, networkVersion);
  }

  public static validate(address, networkVersion) {
    if (!networkVersion) {
      networkVersion = configManager.get("pubKeyHash");
    }

    try {
      const decode = bs58check.decode(address);
      return decode[0] === networkVersion;
    } catch (e) {
      return false;
    }
  }
};
