import { Transactions } from "@arkecosystem/crypto";
import { ITransaction } from "@arkecosystem/crypto/dist/interfaces";

export const makeVoteTransactions = (length: number, voteAssets: string[]): ITransaction[] => {
    const txs: ITransaction[] = [];
    for (let i = 0; i < length; i++) {
        txs[i] = Transactions.BuilderFactory.vote()
            .sign(Math.random().toString(36))
            .votesAsset(voteAssets)
            .build();
    }
    return txs;
}
