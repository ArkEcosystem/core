import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { cloneDeep } from "@arkecosystem/utils";

import { WalletEvent } from "./events";

export class WatcherWallet extends Wallets.Wallet {
    public constructor(
        private app: Contracts.Kernel.Application,
        address: string,
        attributes: Services.Attributes.AttributeMap,
    ) {
        super(app.get<CryptoSuite.CryptoManager>(Container.Identifiers.CryptoManager), address, attributes);

        const handler: ProxyHandler<WatcherWallet> = {
            set(target, key, value) {
                target.app?.events.dispatchSync(WalletEvent.PropertySet, {
                    publicKey: target.publicKey,
                    key: key,
                    value: value,
                    previousValue: target[key],
                    wallet: target,
                });

                target[key] = value;
                return true;
            },
        };

        return new Proxy(this, handler);
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

    public clone(): WatcherWallet {
        const clone = new WatcherWallet(this.app, this.address, cloneDeep(this.attributes));

        for (const key of Object.keys(this)) {
            if (key === "app") {
                continue;
            }

            clone[key] = cloneDeep(this[key]);
        }

        return clone;
    }
}
