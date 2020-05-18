import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Types } from "@arkecosystem/crypto";
import { cloneDeep } from "@arkecosystem/utils";

/**
 * @remarks
 * The Wallet should be (for the most part) treated as a DTO!
 * Other entites and services should be responsible for managing it's state and mutations.
 *
 * @export
 * @class Wallet
 */
@Container.injectable()
export class Wallet implements Contracts.State.Wallet {
    /**
     * @type {(string | undefined)}
     * @memberof Wallet
     */
    public publicKey: string | undefined;

    /**
     * @type {Utils.BigNumber}
     * @memberof Wallet
     */
    public balance: Types.BigNumber;

    /**
     * @type {Utils.BigNumber}
     * @memberof Wallet
     */
    public nonce: Types.BigNumber;

    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoSuite.CryptoManager;

    /**
     * @param {string} address
     * @memberof Wallet
     */
    public constructor(public readonly address: string, private readonly attributes: Services.Attributes.AttributeMap) {
        this.balance = this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.nonce = this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
    }

    /**
     * @returns
     * @memberof Wallet
     */
    public getAttributes() {
        return this.attributes.all();
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof Wallet
     */
    public getAttribute<T>(key: string, defaultValue?: T): T {
        return this.attributes.get<T>(key, defaultValue);
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} value
     * @returns {boolean}
     * @memberof Wallet
     */
    public setAttribute<T = any>(key: string, value: T): boolean {
        return this.attributes.set<T>(key, value);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Wallet
     */
    public forgetAttribute(key: string): boolean {
        return this.attributes.forget(key);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Wallet
     */
    public hasAttribute(key: string): boolean {
        return this.attributes.has(key);
    }

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    public isDelegate(): boolean {
        return this.hasAttribute("delegate");
    }

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    public hasVoted(): boolean {
        return this.hasAttribute("vote");
    }

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    public hasSecondSignature(): boolean {
        return this.hasAttribute("secondPublicKey");
    }

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    public hasMultiSignature(): boolean {
        return this.hasAttribute("multiSignature");
    }

    /**
     * @returns {Contracts.State.Wallet}
     * @memberof Wallet
     */
    public clone(): Contracts.State.Wallet {
        return cloneDeep(this);
    }
}
