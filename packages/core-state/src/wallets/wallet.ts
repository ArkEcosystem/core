import { Contracts, Services } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { WalletEvent } from "./wallet-event";

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
    public balance: Utils.BigNumber = Utils.BigNumber.ZERO;

    /**
     * @type {Utils.BigNumber}
     * @memberof Wallet
     */
    public nonce: Utils.BigNumber = Utils.BigNumber.ZERO;

    /**
     * @param {string} address
     * @memberof Wallet
     */
    public constructor(
        public readonly address: string,
        protected readonly attributes: Services.Attributes.AttributeMap,
        protected readonly events?: Contracts.Kernel.EventDispatcher,
    ) {
        const proxy = new Proxy<Wallet>(this, {
            set: (_, key, value): boolean => {
                const previousValue = this[key];
                this[key] = value;

                this.events?.dispatchSync(WalletEvent.PropertySet, {
                    publicKey: undefined,
                    key,
                    value,
                    previousValue,
                    wallet: this,
                });

                return true;
            },
        });

        return proxy;
    }

    /**
     * @returns {Record<string, any>}
     * @memberof Wallet
     */
    public getAttributes(): Record<string, any> {
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
        const wasSet = this.attributes.set<T>(key, value);

        this.events?.dispatchSync(WalletEvent.PropertySet, {
            publicKey: this.publicKey,
            key: key,
            value,
            wallet: this,
        });

        return wasSet;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Wallet
     */
    public forgetAttribute(key: string): boolean {
        const previousValue = this.attributes.has(key) ? this.attributes.get(key) : undefined;
        const wasSet = this.attributes.forget(key);

        this.events?.dispatchSync(WalletEvent.PropertySet, {
            publicKey: this.publicKey,
            key,
            previousValue,
            wallet: this,
        });

        return wasSet;
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
        const cloned = new Wallet(this.address, this.attributes.clone());
        cloned.publicKey = this.publicKey;
        cloned.balance = this.balance;
        cloned.nonce = this.nonce;
        return cloned;
    }
}
