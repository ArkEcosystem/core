import { CryptoSuite } from "@packages/core-crypto";
import { ITransaction } from "@packages/crypto/src/interfaces";

export const makeVoteTransactions = (
    length: number,
    voteAssets: string[],
    cryptoManager: CryptoSuite.CryptoSuite,
): ITransaction[] => {
    const txs: ITransaction[] = [];
    for (let i = 0; i < length; i++) {
        txs[i] = cryptoManager.TransactionManager.BuilderFactory.vote()
            .sign(Math.random().toString(36))
            .votesAsset(voteAssets)
            .build();
    }
    return txs;
};
