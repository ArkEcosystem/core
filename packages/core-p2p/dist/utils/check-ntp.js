"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const sntp_1 = __importDefault(require("@hapi/sntp"));
const lodash_shuffle_1 = __importDefault(require("lodash.shuffle"));
exports.checkNTP = (hosts, timeout = 1000) => {
    const logger = core_container_1.app.resolvePlugin("logger");
    return new Promise(async (resolve, reject) => {
        for (const host of lodash_shuffle_1.default(hosts)) {
            try {
                const time = await sntp_1.default.time({ host, timeout });
                return resolve({ time, host });
            }
            catch (err) {
                logger.error(`Host ${host} responsed with: ${err.message}`);
            }
        }
        reject(new Error("Please check your NTP connectivity, couldn't connect to any host."));
    });
};
//# sourceMappingURL=check-ntp.js.map