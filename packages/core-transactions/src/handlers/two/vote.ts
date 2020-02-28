import { Models } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

import { AlreadyVotedError, NoVoteError, UnvoteMismatchError } from "../../errors";
import { TransactionReader } from "../../transaction-reader";
import { One } from "../index";
import { TransactionHandlerConstructor } from "../transaction";
import { DelegateRegistrationTransactionHandler } from "./delegate-registration";

@Container.injectable()
export class VoteTransactionHandler extends One.VoteTransactionHandler {
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [DelegateRegistrationTransactionHandler];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.VoteTransaction;
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
