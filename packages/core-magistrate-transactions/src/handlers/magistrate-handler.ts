import { State } from "@arkecosystem/core-interfaces";
import { Handlers, Interfaces } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces, Managers, Utils } from "@arkecosystem/crypto";
import { StaticFeeMismatchError } from "../errors";

export abstract class MagistrateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public dynamicFee({ height }: Interfaces.IDynamicFeeContext): Utils.BigNumber {
        return this.getConstructor().staticFee({ height });
    }

    public async throwIfCannotBeApplied(
        transaction: CryptoInterfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        const staticFee: Utils.BigNumber = this.getConstructor().staticFee();
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
}
