import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { delegateCalculator, roundCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import sumBy from "lodash.sumby";

function formatDelegates(
    delegates: Database.IWallet[],
    lastHeight: number,
): Array<{
    rank: string;
    username: string;
    approval: string;
    votes: string;
    voterCount: string;
}> {
    const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    return delegates.map((delegate: Database.IWallet) => {
        const filteredVoters: Database.IWallet[] = databaseService.walletManager
            .allByPublicKey()
            .filter(wallet => wallet.vote === delegate.publicKey && (wallet.balance as Utils.BigNumber).gt(0.1 * 1e8));

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

        const votes: string = Number(delegate.voteBalance.div(1e8)).toLocaleString(undefined, {
            maximumFractionDigits: 0,
        });

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
}

export function handler(request, h) {
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();
    const { maxDelegates } = roundCalculator.calculateRound(lastBlock.data.height);

    const supply: number = supplyCalculator.calculate(lastBlock.data.height);

    const allByUsername: Database.IWallet[] = databaseService.walletManager
        .allByUsername()
        .map((delegate, index) => {
            delegate.rate = delegate.rate || index + 1;
            return delegate;
        })
        .sort((a, b) => a.rate - b.rate);

    const active: Database.IWallet[] = allByUsername.slice(0, maxDelegates);
    const standby: Database.IWallet[] = allByUsername.slice(
        maxDelegates + 1,
        app.resolveOptions("vote-report").delegateRows,
    );

    const voters: Database.IWallet[] = databaseService.walletManager
        .allByPublicKey()
        .filter(wallet => wallet.vote && (wallet.balance as Utils.BigNumber).gt(0.1 * 1e8));

    const totalVotes: number = sumBy(voters, wallet => +wallet.balance.toFixed());
    const percentage: number = (totalVotes * 100) / supply;

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
            supply: (supply / 1e8).toLocaleString(undefined, {
                maximumFractionDigits: 0,
            }),
            totalVotes: (totalVotes / 1e8).toLocaleString(undefined, {
                maximumFractionDigits: 0,
            }),
            percentage: percentage.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        })
        .type("text/plain");
}
