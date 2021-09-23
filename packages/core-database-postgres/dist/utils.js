"use strict";
/* tslint:disable:forin prefer-for-of*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const path_1 = __importDefault(require("path"));
const pg_promise_1 = require("pg-promise");
exports.camelizeColumns = (pgp, data) => {
    const tmp = data[0];
    for (const prop in tmp) {
        const camel = pgp.utils.camelize(prop);
        if (!(camel in tmp)) {
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                d[camel] = d[prop];
                delete d[prop];
            }
        }
    }
};
exports.loadQueryFile = (directory, file) => {
    const query = new pg_promise_1.QueryFile(path_1.default.join(directory, file), {
        minify: true,
        params: {
            schema: "public",
        },
    });
    if (query.error) {
        core_container_1.app.resolvePlugin("logger").error(query.error.toString());
    }
    return query;
};
//# sourceMappingURL=utils.js.map