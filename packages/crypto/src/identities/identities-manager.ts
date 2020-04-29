import { Network } from "../interfaces";
import { LibraryManager } from "../managers/library-manager";
import { Address } from "./address";
import { Keys } from "./keys";
import { Message } from "./message";
import { PrivateKey } from "./private-key";
import { PublicKey } from "./public-key";
import { WIF } from "./wif";

export class IdentitiesManager<T> {
    public Address: Address<T>;
    public Keys: Keys<T>;
    public PrivateKey: PrivateKey<T>;
    public PublicKey: PublicKey<T>;
    public Wif: WIF<T>;
    public Message: Message<T>;

    public constructor(libraryManager: LibraryManager<T>, network: Network) {
        this.Keys = new Keys(libraryManager, network.wif);

        this.PublicKey = new PublicKey(libraryManager, this.Keys);

        this.Address = new Address(libraryManager, this.PublicKey, network.pubKeyHash);

        this.Message = new Message(libraryManager.Crypto, this.Keys);

        this.PrivateKey = new PrivateKey(this.Keys);

        this.Wif = new WIF(libraryManager, network.wif, this.Keys);
    }
}
