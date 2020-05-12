import { Contracts } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Types } from "@arkecosystem/crypto";

import { StaticFeeMismatchError } from "../errors";

export abstract class MagistrateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return this.cryptoManager.MilestoneManager.getMilestone().aip11 === true;
    }

    public dynamicFee({ height }: Contracts.Shared.DynamicFeeContext): Types.BigNumber {
        return this.getConstructor().staticFee(this.cryptoManager, { height });
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (this.cryptoManager.LibraryManager.Utils.isException(transaction.data.id)) {
            return;
        }

        const staticFee: Types.BigNumber = this.getConstructor().staticFee(this.cryptoManager);
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }
}
