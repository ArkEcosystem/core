import { Contracts } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces, Managers, Utils } from "@arkecosystem/crypto";

import { StaticFeeMismatchError } from "../errors";

export abstract class MagistrateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public dynamicFee({ height }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        return this.getConstructor().staticFee({ height });
    }

    public async throwIfCannotBeApplied(
        transaction: CryptoInterfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (Utils.isException(transaction.data.id)) {
            return;
        }

        const staticFee: Utils.BigNumber = this.getConstructor().staticFee();
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }
}
