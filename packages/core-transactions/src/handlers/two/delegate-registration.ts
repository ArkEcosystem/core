import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

import { TransactionReader } from "../../transaction-reader";
import { One } from "../index";

@Container.injectable()
export class DelegateRegistrationTransactionHandler extends One.DelegateRegistrationTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor<BlockInterfaces.IBlockData> {
        return Transactions.Two.DelegateRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            wallet.setAttribute<Contracts.State.WalletDelegateAttributes>("delegate", {
                username: transaction.asset.delegate!.username,
                voteBalance: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                forgedFees: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                forgedRewards: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                producedBlocks: 0,
                rank: undefined,
            });

            this.walletRepository.index(wallet);
        }

        const forgedBlocks = await this.blockRepository.getDelegatesForgedBlocks();
        const lastForgedBlocks = await this.blockRepository.getLastForgedBlocks();
        for (const block of forgedBlocks) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(block.generatorPublicKey);

            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }

            const delegate: Contracts.State.WalletDelegateAttributes = wallet.getAttribute("delegate");
            delegate.forgedFees = delegate.forgedFees.plus(block.totalFees);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.totalRewards);
            delegate.producedBlocks += +block.totalProduced;
        }

        for (const block of lastForgedBlocks) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(block.generatorPublicKey);

            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }

            wallet.setAttribute("delegate.lastBlock", block);
        }
    }
}
