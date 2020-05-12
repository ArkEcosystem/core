import { CryptoManager } from "@arkecosystem/core-crypto";

export const isRecipientOnActiveNetwork = (recipientId: string, cryptoManager: CryptoManager): boolean =>
    cryptoManager.LibraryManager.Crypto.Base58.decodeCheck(recipientId).readUInt8(0) ===
    cryptoManager.NetworkConfigManager.get("network.pubKeyHash");
