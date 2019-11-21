import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces, Managers, Utils } from "@arkecosystem/crypto";
import { Contracts } from "@arkecosystem/core-kernel";
import { InvalidFeeError } from "../errors";

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

        if (!transaction.data.fee.isEqualTo(this.getConstructor().staticFee())) {
            throw new InvalidFeeError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }
}