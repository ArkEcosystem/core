import { Transactions } from "@packages/crypto/src";
import { ITransaction } from "@packages/crypto/src/interfaces";

export const makeVoteTransactions = (length: number, voteAssets: string[]): ITransaction[] => {
    const txs: ITransaction[] = [];
    for (let i = 0; i < length; i++) {
        txs[i] = Transactions.BuilderFactory.vote().sign(Math.random().toString(36)).votesAsset(voteAssets).build();
    }
    return txs;
};
