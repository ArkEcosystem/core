import { Network } from "../interfaces";
import { LibraryManager } from "../managers/library-manager";
import { Address } from "./address";
import { Keys } from "./keys";
import { Message } from "./message";
import { PrivateKey } from "./private-key";
import { PublicKey } from "./public-key";
import { WIF } from "./wif";

export class Identities<T> {
    public address: Address<T>;
    public keys: Keys;
    public privateKey: PrivateKey;
    public publicKey: PublicKey;
    public wif: WIF;
    public message: Message<T>;

    public constructor(private libraryManager: LibraryManager<T>, private network: Network) {
        this.keys = new Keys(
            this.libraryManager.Crypto.HashAlgorithms.sha256,
            this.libraryManager.libraries.secp256k1,
            this.libraryManager.libraries.wif,
            this.network.wif,
        );

        this.publicKey = new PublicKey(
            this.keys,
            this.libraryManager.libraries.secp256k1,
            this.libraryManager.Crypto.numberToHex,
        );

        this.address = new Address(libraryManager, this.publicKey, network.pubKeyHash);

        this.message = new Message(this.libraryManager.Crypto, this.keys);

        this.privateKey = new PrivateKey(this.keys);

        this.wif = new WIF(this.libraryManager.libraries.wif, this.network.wif, this.keys);
    }
}
