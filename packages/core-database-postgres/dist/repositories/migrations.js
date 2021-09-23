"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const queries_1 = require("../queries");
const repository_1 = require("./repository");
class MigrationsRepository extends repository_1.Repository {
    async findByName(name) {
        return this.db.oneOrNone(queries_1.queries.migrations.find, { name });
    }
    getModel() {
        return new models_1.Migration(this.pgp);
    }
}
exports.MigrationsRepository = MigrationsRepository;
//# sourceMappingURL=migrations.js.map