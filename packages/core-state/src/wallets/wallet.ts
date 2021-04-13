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

    public getAddress(): string {
        return this.address;
    }

    public getPublicKey(): string | undefined {
        return this.publicKey;
    }

    public setPublicKey(publicKey: string): void {
        this.publicKey = publicKey;
    }

    public getBalance(): Utils.BigNumber {
        return this.balance;
    }

    public setBalance(balance: Utils.BigNumber): void {
        this.balance = balance;
    }

    public getNonce(): Utils.BigNumber {
        return this.nonce;
    }

    public setNonce(nonce: Utils.BigNumber): void {
        this.nonce = nonce;
    }

    public increaseBalance(balance: Utils.BigNumber): Contracts.State.Wallet {
        this.balance = this.balance.plus(balance);

        return this;
    }

    public decreaseBalance(balance: Utils.BigNumber): Contracts.State.Wallet {
        this.balance = this.balance.minus(balance);

        return this;
    }

    public increaseNonce(): void {
        this.nonce = this.nonce.plus(Utils.BigNumber.ONE);
    }

    public decreaseNonce(): void {
        this.nonce = this.nonce.minus(Utils.BigNumber.ONE);
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
        const na = Symbol();
        const previousValue = this.attributes.get(key, na);
        const wasSet = this.attributes.forget(key);

        this.events?.dispatchSync(WalletEvent.PropertySet, {
            publicKey: this.publicKey,
            key,
            previousValue: previousValue === na ? undefined : previousValue,
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
