"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const dns_1 = __importDefault(require("dns"));
const lodash_shuffle_1 = __importDefault(require("lodash.shuffle"));
const util_1 = __importDefault(require("util"));
exports.checkDNS = async (hosts) => {
    hosts = lodash_shuffle_1.default(hosts);
    const lookupService = util_1.default.promisify(dns_1.default.lookupService);
    for (let i = hosts.length - 1; i >= 0; i--) {
        try {
            await lookupService(hosts[i], 53);
            return Promise.resolve(hosts[i]);
        }
        catch (err) {
            core_container_1.app.resolvePlugin("logger").error(err.message);
        }
    }
    return Promise.reject(new Error("Please check your network connectivity, couldn't connect to any host."));
};
//# sourceMappingURL=check-dns.js.map