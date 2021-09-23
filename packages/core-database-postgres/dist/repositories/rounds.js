"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const queries_1 = require("../queries");
const repository_1 = require("./repository");
class RoundsRepository extends repository_1.Repository {
    async findById(round) {
        return this.db.manyOrNone(queries_1.queries.rounds.find, { round });
    }
    async delete(round, db) {
        db = db || this.db;
        return db.none(queries_1.queries.rounds.delete, { round });
    }
    async insert(delegates) {
        const rounds = delegates.map(delegate => {
            return {
                publicKey: delegate.publicKey,
                balance: delegate.getAttribute("delegate.voteBalance"),
                round: delegate.getAttribute("delegate.round"),
            };
        });
        await super.insert(rounds);
    }
    async update(items) {
        return;
    }
    getModel() {
        return new models_1.Round(this.pgp);
    }
}
exports.RoundsRepository = RoundsRepository;
//# sourceMappingURL=rounds.js.map