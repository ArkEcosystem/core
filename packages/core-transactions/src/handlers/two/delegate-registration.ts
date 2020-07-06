import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";

import { One } from "../index";

@Container.injectable()
export class DelegateRegistrationTransactionHandler extends One.DelegateRegistrationTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.DelegateRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<string>(transaction.asset?.delegate?.username);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            wallet.setAttribute<Contracts.State.WalletDelegateAttributes>("delegate", {
                username: transaction.asset.delegate.username,
                voteBalance: Utils.BigNumber.ZERO,
                forgedFees: Utils.BigNumber.ZERO,
                forgedRewards: Utils.BigNumber.ZERO,
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
