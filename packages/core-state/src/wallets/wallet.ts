import { Contracts, Services } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { WalletEvent } from "./wallet-event";

export class Wallet implements Contracts.State.Wallet {
    private _publicKey?: string;
    private _balance: Utils.BigNumber = Utils.BigNumber.ZERO;
    private _nonce: Utils.BigNumber = Utils.BigNumber.ZERO;

    /**
     * @param {string} address
     * @memberof Wallet
     */
    public constructor(
        public readonly address: string,
        protected readonly attributes: Services.Attributes.AttributeMap,
        protected readonly events?: Contracts.Kernel.EventDispatcher,
    ) {
        if (this.events) {
            this.events.dispatchSync(WalletEvent.PropertySet, {
                publicKey: undefined,
                key: "address",
                value: address,
                previousValue: undefined,
                wallet: this,
            });
        }
    }

    public get publicKey(): string | undefined {
        return this._publicKey;
    }

    public set publicKey(value: string | undefined) {
        const previousValue = this._publicKey;
        this._publicKey = value;

        if (this.events) {
            this.events.dispatchSync(WalletEvent.PropertySet, {
                publicKey: this._publicKey,
                key: "publicKey",
                value,
                previousValue,
                wallet: this,
            });
        }
    }

    public get balance(): Utils.BigNumber {
        return this._balance;
    }

    public set balance(value: Utils.BigNumber) {
        const previousValue = this._balance;
        this._balance = value;

        if (this.events) {
            this.events.dispatchSync(WalletEvent.PropertySet, {
                publicKey: this._publicKey,
                key: "balance",
                value,
                previousValue,
                wallet: this,
            });
        }
    }

    public get nonce(): Utils.BigNumber {
        return this._nonce;
    }

    public set nonce(value: Utils.BigNumber) {
        const previousValue = this._nonce;
        this._nonce = value;

        if (this.events) {
            this.events.dispatchSync(WalletEvent.PropertySet, {
                publicKey: this._publicKey,
                key: "nonce",
                value,
                previousValue,
                wallet: this,
            });
        }
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

        if (this.events) {
            this.events.dispatchSync(WalletEvent.PropertySet, {
                publicKey: this._publicKey,
                key: "balance",
                value,
                wallet: this,
            });
        }

        return wasSet;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Wallet
     */
    public forgetAttribute(key: string): boolean {
        const previousValue = this.attributes.get(key, undefined);
        const wasSet = this.attributes.forget(key);

        if (this.events) {
            this.events.dispatchSync(WalletEvent.PropertySet, {
                publicKey: this._publicKey,
                key: "balance",
                previousValue,
                wallet: this,
            });
        }

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
