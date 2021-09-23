"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = require("./emitter");
exports.plugin = {
    pkg: require("../package.json"),
    required: true,
    alias: "event-emitter",
    register() {
        return new emitter_1.EventEmitter();
    },
};
var ApplicationEvents;
(function (ApplicationEvents) {
    ApplicationEvents["ApplicationShutdown"] = "shutdown";
    ApplicationEvents["BlockApplied"] = "block.applied";
    ApplicationEvents["BlockDisregarded"] = "block.disregarded";
    ApplicationEvents["BlockForged"] = "block.forged";
    ApplicationEvents["BlockReceived"] = "block.received";
    ApplicationEvents["BlockReverted"] = "block.reverted";
    ApplicationEvents["DelegateRegistered"] = "delegate.registered";
    ApplicationEvents["DelegateResigned"] = "delegate.resigned";
    ApplicationEvents["ForgerFailed"] = "forger.failed";
    ApplicationEvents["ForgerMissing"] = "forger.missing";
    ApplicationEvents["ForgerStarted"] = "forger.started";
    ApplicationEvents["InternalMilestoneChanged"] = "internal.milestone.changed";
    ApplicationEvents["PeerAdded"] = "peer.added";
    ApplicationEvents["PeerRemoved"] = "peer.removed";
    ApplicationEvents["RoundApplied"] = "round.applied";
    ApplicationEvents["RoundCreated"] = "round.created";
    ApplicationEvents["RoundMissed"] = "round.missed";
    ApplicationEvents["SnapshotStart"] = "snapshot.start";
    ApplicationEvents["SnapshotProgress"] = "snapshot.progress";
    ApplicationEvents["SnapshotComplete"] = "snapshot.complete";
    ApplicationEvents["StateBuilderFinished"] = "stateBuilder.finished";
    ApplicationEvents["StateStarting"] = "state.starting";
    ApplicationEvents["StateStarted"] = "state.started";
    ApplicationEvents["TransactionApplied"] = "transaction.applied";
    ApplicationEvents["TransactionExpired"] = "transaction.expired";
    ApplicationEvents["TransactionForged"] = "transaction.forged";
    ApplicationEvents["TransactionPoolAdded"] = "transaction.pool.added";
    ApplicationEvents["TransactionPoolRejected"] = "transaction.pool.rejected";
    ApplicationEvents["TransactionPoolRemoved"] = "transaction.pool.removed";
    ApplicationEvents["TransactionReverted"] = "transaction.reverted";
    ApplicationEvents["WalletVote"] = "wallet.vote";
    ApplicationEvents["WalletUnvote"] = "wallet.unvote";
})(ApplicationEvents = exports.ApplicationEvents || (exports.ApplicationEvents = {}));
//# sourceMappingURL=index.js.map