import { HashAlgorithms } from "../crypto/hash-algorithms";
import { Network } from "../interfaces";
import { LibraryManager } from "../managers/library-manager";
import { Address } from "./address";
import { Keys } from "./keys";
import { PrivateKey } from "./private-key";
import { PublicKey } from "./public-key";
import { WIF } from "./wif";

export class Identities {
    public address: Address;
    public keys: Keys;
    public privateKey: PrivateKey;
    public publicKey: PublicKey;
    public wif: WIF;

    public constructor(
        private libraryManager: LibraryManager,
        private hashAlgorithms: HashAlgorithms,
        private network: Network,
    ) {
        this.keys = new Keys(
            this.hashAlgorithms.sha256,
            this.libraryManager.libraries.secp256k1,
            this.libraryManager.libraries.wif,
            this.network.wif,
        );

        this.publicKey = new PublicKey(
            this.keys,
            this.libraryManager.libraries.secp256k1,
            this.libraryManager.Crypto.numberToHex,
        );

        this.address = new Address(
            this.libraryManager.Crypto.Base58,
            this.hashAlgorithms.ripemd160,
            this.publicKey,
            network.pubKeyHash,
        );

        this.privateKey = new PrivateKey(this.keys);

        this.wif = new WIF(this.libraryManager.libraries.wif, this.network.wif, this.keys);
    }
}
