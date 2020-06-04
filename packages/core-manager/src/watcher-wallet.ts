import { Contracts, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Utils } from "@arkecosystem/crypto";
import { cloneDeep } from "@arkecosystem/utils";

import { WalletEvent } from "./events";

export class WatcherWallet extends Wallets.Wallet {
    public constructor(
        private app: Contracts.Kernel.Application,
        address: string,
        attributes: Services.Attributes.AttributeMap,
    ) {
        super(address, attributes);
    }

    public set balance(balance: Utils.BigNumber) {
        this.app?.events.dispatchSync(WalletEvent.BalanceUpdated, {
            publicKey: this.publicKey,
            balance: balance,
            previousBalance: super.balance,
            wallet: this,
        });

        super.balance = balance;
    }

    public set nonce(nonce: Utils.BigNumber) {
        this.app?.events.dispatchSync(WalletEvent.NonceUpdated, {
            publicKey: this.publicKey,
            nonce: nonce,
            previousNonce: super.nonce,
            wallet: this,
        });

        super.nonce = nonce;
    }

    public setAttribute<T = any>(key: string, value: T): boolean {
        const isSet = super.setAttribute(key, value);

        this.app?.events.dispatchSync(WalletEvent.AttributeSet, {
            publicKey: this.publicKey,
            isSet: isSet,
            key: key,
            value: value,
            wallet: this,
        });

        return isSet;
    }

    public forgetAttribute(key: string): boolean {
        const previousValue = super.getAttribute(key);
        const isForget = super.forgetAttribute(key);

        this.app?.events.dispatchSync(WalletEvent.AttributeForget, {
            publicKey: this.publicKey,
            isForget: isForget,
            key: key,
            previousValue: previousValue,
            wallet: this,
        });

        return isForget;
    }

    public clone(): Contracts.State.Wallet {
        const clone = new WatcherWallet(this.app, this.address, cloneDeep(this.attributes));

        clone.publicKey = this.publicKey;
        clone.balance = this.balance;
        clone.nonce = this.nonce;

        return clone;
    }
}
