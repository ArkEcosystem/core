import { State } from "@arkecosystem/core-interfaces";
import { Handlers, Interfaces } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces, Managers, Utils } from "@arkecosystem/crypto";
import { InvalidFeeError } from "../errors";

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

        if (!transaction.data.fee.isEqualTo(this.getConstructor().staticFee())) {
            throw new InvalidFeeError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
}
