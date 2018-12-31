import crypto from "crypto";
import { configManager } from "../managers";
import { crypto as arkCrypto } from "./crypto";

const createHash = message =>
    crypto
        .createHash("sha256")
        .update(Buffer.from(message, "utf-8"))
        .digest();

export class Message {
    /**
     * Sign the given message.
     * @param  {String} message
     * @param  {String} passphrase
     * @return {Object}
     */
    public static sign(message, passphrase) {
        const keys = arkCrypto.getKeys(passphrase);

        return {
            publicKey: keys.publicKey,
            signature: arkCrypto.signHash(createHash(message), keys),
            message,
        };
    }

    /**
     * Sign the given message using a WIF.
     * @param  {String} message
     * @param  {String} wif
     * @param  {Object} network
     * @return {Object}
     */
    public static signWithWif(message, wif, network?: any) {
        if (!network) {
            network = configManager.all();
        }

        const keys = arkCrypto.getKeysFromWIF(wif, network);

        return {
            publicKey: keys.publicKey,
            signature: arkCrypto.signHash(createHash(message), keys),
            message,
        };
    }

    /**
     * Verify the given message.
     * @param  {String} options.message
     * @param  {String} options.publicKey
     * @param  {String} options.signature
     * @return {Boolean}
     */
    public static verify({ message, publicKey, signature }) {
        return arkCrypto.verifyHash(createHash(message), signature, publicKey);
    }
}
