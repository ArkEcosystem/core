import { State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { EntityRegisterSubHandler } from "../register";
import { EntityNameDoesNotMatchDelegateError, EntitySenderIsNotDelegateError } from "./errors";

export class DelegateRegisterSubHandler extends EntityRegisterSubHandler {
    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.throwIfCannotBeApplied(transaction, wallet, walletManager);

        if (!wallet.hasAttribute("delegate.username")) {
            throw new EntitySenderIsNotDelegateError();
        }

        if (wallet.getAttribute("delegate.username") !== transaction.data.asset.data.name) {
            throw new EntityNameDoesNotMatchDelegateError();
        }
    }
}
