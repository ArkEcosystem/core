import { app, Contracts } from "@arkecosystem/core-kernel";
import { delegateCalculator, roundCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";

const formatDelegates = (
    delegates: Contracts.State.IWallet[],
    lastHeight: number,
): Array<{
    rank: string;
    username: string;
    approval: string;
    votes: string;
    voterCount: string;
}> => {
    const databaseService: Contracts.Database.IDatabaseService = app.resolve<Contracts.Database.IDatabaseService>(
        "database",
    );

    return delegates.map((delegate: Contracts.State.IWallet) => {
        const filteredVoters: Contracts.State.IWallet[] = databaseService.walletManager
            .allByPublicKey()
            .filter(
                wallet => wallet.getAttribute<string>("vote") === delegate.publicKey && wallet.balance.gt(0.1 * 1e8),
            );

        const approval: string = Number(delegateCalculator.calculateApproval(delegate, lastHeight)).toLocaleString(
            undefined,
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        );

        const rank: string = delegate.getAttribute<number>("delegate.rank").toLocaleString(undefined, {
            minimumIntegerDigits: 2,
        });

        const votes: string = Number(
            delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance").div(1e8),
        ).toLocaleString(undefined, {
            maximumFractionDigits: 0,
        });

        const voterCount: string = filteredVoters.length.toLocaleString(undefined, {
            maximumFractionDigits: 0,
        });

        return {
            rank,
            username: delegate.getAttribute<string>("delegate.username").padEnd(25),
            approval: approval.padEnd(4),
            votes: votes.padStart(10),
            voterCount: voterCount.padStart(5),
        };
    });
};

export const handler = (request, h) => {
    const blockchain: Contracts.Blockchain.IBlockchain = app.resolve<Contracts.Blockchain.IBlockchain>("blockchain");
    const databaseService: Contracts.Database.IDatabaseService = app.resolve<Contracts.Database.IDatabaseService>(
        "database",
    );

    const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();
    const { maxDelegates } = roundCalculator.calculateRound(lastBlock.data.height);

    const supply: Utils.BigNumber = Utils.BigNumber.make(supplyCalculator.calculate(lastBlock.data.height));

    const allByUsername: Contracts.State.IWallet[] = databaseService.walletManager
        .allByUsername()
        .map((delegate, index) => {
            delegate.setAttribute("delegate.rank", delegate.getAttribute("delegate.rank") || index + 1);
            return delegate;
        })
        .sort((a, b) => a.getAttribute<number>("delegate.rank") - b.getAttribute<number>("delegate.rank"));

    const active: Contracts.State.IWallet[] = allByUsername.slice(0, maxDelegates);
    const standby: Contracts.State.IWallet[] = allByUsername.slice(
        maxDelegates + 1,
        app.resolve("vote-report.options").delegateRows,
    );

    const voters: Contracts.State.IWallet[] = databaseService.walletManager
        .allByPublicKey()
        .filter(wallet => wallet.hasVoted() && (wallet.balance as Utils.BigNumber).gt(0.1 * 1e8));

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
