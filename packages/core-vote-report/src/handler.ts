import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { delegateCalculator, roundCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { Managers, Utils } from "@arkecosystem/crypto";
import sumBy from "lodash.sumby";

export function handler(request, h) {
    const config = app.getConfig();
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const formatDelegates = (delegates: Database.IWallet[], lastHeight: number) =>
        delegates.map((delegate: Database.IWallet, index: number) => {
            const filteredVoters = databaseService.walletManager
                .allByPublicKey()
                .filter(wallet => wallet.vote === delegate.publicKey && (wallet.balance as Utils.Bignum).gt(0.1 * 1e8));

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

    const lastBlock = blockchain.getLastBlock();
    const { maxDelegates } = roundCalculator.calculateRound(lastBlock.data.height);

    // @ts-ignore
    const delegateRows = request.server.app.config.delegateRows;

    const supply = supplyCalculator.calculate(lastBlock.data.height);

    const allByUsername = databaseService.walletManager
        .allByUsername()
        .map((delegate, index) => {
            (delegate as any).rate = (delegate as any).rate || index + 1;
            return delegate;
        })
        .sort((a, b) => (a as any).rate - (b as any).rate);

    const active = allByUsername.slice(0, maxDelegates);
    const standby = allByUsername.slice(maxDelegates + 1, delegateRows);

    const voters = databaseService.walletManager
        .allByPublicKey()
        .filter(wallet => wallet.vote && (wallet.balance as Utils.Bignum).gt(0.1 * 1e8));

    const totalVotes = sumBy(voters, wallet => +wallet.balance.toFixed());
    const percentage = (totalVotes * 100) / supply;

    const client = Managers.configManager.get("client");

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
