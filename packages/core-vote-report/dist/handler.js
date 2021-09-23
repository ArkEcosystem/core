"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const formatDelegates = (delegates, lastHeight) => {
    const databaseService = core_container_1.app.resolvePlugin("database");
    return delegates.map((delegate) => {
        const filteredVoters = databaseService.walletManager
            .allByPublicKey()
            .filter(wallet => wallet.getAttribute("vote") === delegate.publicKey &&
            wallet.balance.isGreaterThan(0.1 * 1e8));
        const approval = Number(core_utils_1.delegateCalculator.calculateApproval(delegate, lastHeight)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        const rank = delegate.getAttribute("delegate.rank").toLocaleString(undefined, {
            minimumIntegerDigits: 2,
        });
        const votes = Number(delegate.getAttribute("delegate.voteBalance").div(1e8)).toLocaleString(undefined, {
            maximumFractionDigits: 0,
        });
        const voterCount = filteredVoters.length.toLocaleString(undefined, {
            maximumFractionDigits: 0,
        });
        return {
            rank,
            username: delegate.getAttribute("delegate.username").padEnd(25),
            approval: approval.padEnd(4),
            votes: votes.padStart(10),
            voterCount: voterCount.padStart(5),
        };
    });
};
exports.handler = (request, h) => {
    const blockchain = core_container_1.app.resolvePlugin("blockchain");
    const databaseService = core_container_1.app.resolvePlugin("database");
    const lastBlock = blockchain.getLastBlock();
    const { maxDelegates } = core_utils_1.roundCalculator.calculateRound(lastBlock.data.height);
    const supply = crypto_1.Utils.BigNumber.make(core_utils_1.supplyCalculator.calculate(lastBlock.data.height));
    const allByUsername = databaseService.walletManager
        .allByUsername()
        .map((delegate, index) => {
        delegate.setAttribute("delegate.rank", delegate.getAttribute("delegate.rank") || index + 1);
        return delegate;
    })
        .sort((a, b) => a.getAttribute("delegate.rank") - b.getAttribute("delegate.rank"));
    const active = allByUsername.slice(0, maxDelegates);
    const standby = allByUsername.slice(maxDelegates + 1, core_container_1.app.resolveOptions("vote-report").delegateRows);
    const voters = databaseService.walletManager
        .allByPublicKey()
        .filter(wallet => wallet.hasVoted() && wallet.balance.isGreaterThan(0.1 * 1e8));
    const totalVotes = voters
        .map(wallet => wallet.balance)
        .reduce((a, b) => a.plus(b), crypto_1.Utils.BigNumber.ZERO);
    const client = crypto_1.Managers.configManager.get("network.client");
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
        supply: supply.div(1e8).toFixed(),
        totalVotes: totalVotes.div(1e8).toFixed(),
        percentage: totalVotes
            .times(100)
            .div(supply)
            .toFixed(),
    })
        .type("text/plain");
};
//# sourceMappingURL=handler.js.map