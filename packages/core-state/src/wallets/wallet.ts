import { Contracts, Services } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { WalletEvent } from "./wallet-event";

export class Wallet implements Contracts.State.Wallet {
    protected publicKey: string | undefined;
    protected balance: Utils.BigNumber = Utils.BigNumber.ZERO;
    protected nonce: Utils.BigNumber = Utils.BigNumber.ZERO;

    public constructor(
        protected readonly address: string,
        protected readonly attributes: Services.Attributes.AttributeMap,
        protected readonly events?: Contracts.Kernel.EventDispatcher,
    ) {}

    public getAddress(): string {
        return this.address;
    }

    public getPublicKey(): string | undefined {
        return this.publicKey;
    }

    public setPublicKey(publicKey: string): void {
        const previousValue = this.publicKey;

        this.publicKey = publicKey;

        this.events?.dispatchSync(WalletEvent.PropertySet, {
            publicKey: this.publicKey,
            key: "publicKey",
            value: publicKey,
            previousValue,
            wallet: this,
        });
    }

    public getBalance(): Utils.BigNumber {
        return this.balance;
    }

    public setBalance(balance: Utils.BigNumber): void {
        const previousValue = this.balance;

        this.balance = balance;

        this.events?.dispatchSync(WalletEvent.PropertySet, {
            publicKey: this.publicKey,
            key: "balance",
            value: balance,
            previousValue,
            wallet: this,
        });
    }

    public getNonce(): Utils.BigNumber {
        return this.nonce;
    }

    public setNonce(nonce: Utils.BigNumber): void {
        const previousValue = this.nonce;

        this.nonce = nonce;

        this.events?.dispatchSync(WalletEvent.PropertySet, {
            publicKey: this.publicKey,
            key: "nonce",
            value: nonce,
            previousValue,
            wallet: this,
        });
    }

    public increaseBalance(balance: Utils.BigNumber): Contracts.State.Wallet {
        this.setBalance(this.balance.plus(balance));

        return this;
    }

    public decreaseBalance(balance: Utils.BigNumber): Contracts.State.Wallet {
        this.setBalance(this.balance.minus(balance));

        return this;
    }

    public increaseNonce(): void {
        this.setNonce(this.nonce.plus(Utils.BigNumber.ONE));
    }

    public decreaseNonce(): void {
        this.setNonce(this.nonce.minus(Utils.BigNumber.ONE));
    }

    public getData(): Contracts.State.WalletData {
        return {
            address: this.address,
            publicKey: this.publicKey,
            balance: this.balance,
            nonce: this.nonce,
            attributes: this.attributes,
        };
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
