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
    public keys: Keys<T>;
    public privateKey: PrivateKey<T>;
    public publicKey: PublicKey<T>;
    public wif: WIF<T>;
    public message: Message<T>;

    public constructor(libraryManager: LibraryManager<T>, network: Network) {
        this.keys = new Keys(libraryManager, network.wif);

        this.publicKey = new PublicKey(libraryManager, this.keys);

        this.address = new Address(libraryManager, this.publicKey, network.pubKeyHash);

        this.message = new Message(libraryManager.Crypto, this.keys);

        this.privateKey = new PrivateKey(this.keys);

        this.wif = new WIF(libraryManager, network.wif, this.keys);
    }
}
