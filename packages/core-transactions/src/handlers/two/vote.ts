import { Transactions } from "@arkecosystem/crypto";
import { TransactionHandlerConstructor } from "../transaction";
import { Container } from "@arkecosystem/core-kernel";
import { TransactionReader } from "../../transaction-reader";
import { Models } from "@arkecosystem/core-database";
import { AlreadyVotedError, NoVoteError, UnvoteMismatchError } from "../../errors";
import { One, Two } from "../index";

@Container.injectable()
export class VoteTransactionHandler extends One.VoteTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.VoteTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [Two.DelegateRegistrationTransactionHandler];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const vote = transaction.asset.votes![0];
            const hasVoted: boolean = wallet.hasAttribute("vote");

            if (vote.startsWith("+")) {
                if (hasVoted) {
                    throw new AlreadyVotedError();
                }
                wallet.setAttribute("vote", vote.slice(1));
            } else {
                if (!hasVoted) {
                    throw new NoVoteError();
                } else if (wallet.getAttribute("vote") !== vote.slice(1)) {
                    throw new UnvoteMismatchError();
                }
                wallet.forgetAttribute("vote");
            }
        }
    }

}