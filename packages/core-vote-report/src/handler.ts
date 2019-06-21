import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, State } from "@arkecosystem/core-interfaces";
import { delegateCalculator, roundCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";

const formatDelegates = (
    delegates: State.IWallet[],
    lastHeight: number,
): Array<{
    rank: string;
    username: string;
    approval: string;
    votes: string;
    voterCount: string;
}> => {
    const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    return delegates.map((delegate: State.IWallet) => {
        const filteredVoters: State.IWallet[] = databaseService.walletManager
            .allByPublicKey()
            .filter(wallet => wallet.vote === delegate.publicKey && wallet.balance.gt(0.1 * 1e8));

        const approval: string = Number(delegateCalculator.calculateApproval(delegate, lastHeight)).toLocaleString(
            undefined,
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        );

        const rank: string = delegate.rate.toLocaleString(undefined, {
            minimumIntegerDigits: 2,
        });

        const votes: string = delegate.voteBalance.div(1e8).toFixed(0);

        const voterCount: string = filteredVoters.length.toLocaleString(undefined, {
            maximumFractionDigits: 0,
        });

        return {
            rank,
            username: delegate.username.padEnd(25),
            approval: approval.padEnd(4),
            votes: votes.padStart(10),
            voterCount: voterCount.padStart(5),
        };
    });
};

export const handler = (request, h) => {
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();
    const { maxDelegates } = roundCalculator.calculateRound(lastBlock.data.height);

    const supply: Utils.BigNumber = Utils.BigNumber.make(supplyCalculator.calculate(lastBlock.data.height));

    const allByUsername: State.IWallet[] = databaseService.walletManager
        .allByUsername()
        .map((delegate, index) => {
            delegate.rate = delegate.rate || index + 1;
            return delegate;
        })
        .sort((a, b) => a.rate - b.rate);

    const active: State.IWallet[] = allByUsername.slice(0, maxDelegates);
    const standby: State.IWallet[] = allByUsername.slice(
        maxDelegates + 1,
        app.resolveOptions("vote-report").delegateRows,
    );

    const voters: State.IWallet[] = databaseService.walletManager
        .allByPublicKey()
        .filter(wallet => wallet.vote && (wallet.balance as Utils.BigNumber).gt(0.1 * 1e8));

    const totalVotes: Utils.BigNumber = voters
        .map(wallet => wallet.balance)
        .reduce((a: Utils.BigNumber, b: Utils.BigNumber) => a.plus(b), Utils.BigNumber.ZERO);

    const client: {
        token: string;
        symbol: string;
        explorer: string;
    } = Managers.configManager.get("network.client");

    return h
        .view("index", {
            client,
            voteHeader: `Vote ${client.token}`.padStart(10),
            activeDelegatesCount: maxDelegates,
            activeDelegates: formatDelegates(active, lastBlock.data.height),
            standbyDelegates: formatDelegates(standby, lastBlock.data.height),
            voters: voters.length.toLocaleString(undefined, {
                maximumFractionDigits: 0,
            }),
            supply: supply.div(1e8).toFixed(0),
            totalVotes: totalVotes.div(1e8).toFixed(0),
            percentage: totalVotes
                .times(100)
                .div(supply)
                .toFixed(2),
        })
        .type("text/plain");
};
