import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Contracts } from "@arkecosystem/core-kernel";
import { app } from "@arkecosystem/core-kernel";
import { delegateCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { configManager } from "@arkecosystem/crypto";
import sumBy from "lodash/sumBy";

export function handler(request, h) {
    const config = app.getConfig();
    const database = app.resolve<PostgresConnection>("database");

    const formatDelegates = (delegates, lastHeight) =>
        delegates.map((delegate, index) => {
            const filteredVoters = database.walletManager
                .allByPublicKey()
                .filter(wallet => wallet.vote === delegate.publicKey && wallet.balance > 0.1 * 1e8);

            const approval = Number(delegateCalculator.calculateApproval(delegate, lastHeight)).toLocaleString(
                undefined,
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                },
            );

            const rank = delegate.rate.toLocaleString(undefined, {
                minimumIntegerDigits: 2,
            });

            const votes = Number(delegate.voteBalance.div(1e8)).toLocaleString(undefined, { maximumFractionDigits: 0 });
            const voterCount = filteredVoters.length.toLocaleString(undefined, {
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

    const lastBlock = app.blockchain.getLastBlock();
    const constants = config.getMilestone(lastBlock.data.height);
    // @ts-ignore
    const delegateRows = request.server.app.config.delegateRows;

    const supply = supplyCalculator.calculate(lastBlock.data.height);

    const allByUsername = database.walletManager
        .allByUsername()
        .map((delegate, index) => {
            delegate.rate = delegate.rate || index + 1;
            return delegate;
        })
        .sort((a, b) => a.rate - b.rate);

    const active = allByUsername.slice(0, constants.activeDelegates);
    const standby = allByUsername.slice(constants.activeDelegates + 1, delegateRows);

    const voters = database.walletManager.allByPublicKey().filter(wallet => wallet.vote && wallet.balance > 0.1 * 1e8);

    const totalVotes = sumBy(voters, (wallet: any) => +wallet.balance.toFixed());
    const percentage = (totalVotes * 100) / supply;

    const client = configManager.get("client");

    return h
        .view("index", {
            client,
            voteHeader: `Vote ${client.token}`.padStart(10),
            activeDelegatesCount: constants.activeDelegates,
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
