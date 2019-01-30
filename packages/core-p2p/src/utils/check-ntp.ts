import { app } from "@arkecosystem/core-kernel";
import shuffle from "lodash/shuffle";
import Sntp from "sntp";

/**
 * Check if it is possible to connect to any NTP host.
 * @param {Array} hosts
 * @param {Number} [timeout = 1000]
 * @return {Promise}
 */
export const checkNTP = (hosts, timeout = 1000): any => {
    hosts = shuffle(hosts);

    return new Promise(async (resolve, reject) => {
        for (const host of hosts) {
            try {
                const time = await Sntp.time({ host, timeout });

                return time.errno
                    ? app.logger.error(`Host ${host} responsed with: ${time.message}`)
                    : resolve({ time, host });
            } catch (err) {
                app.logger.error(`Host ${host} responsed with: ${err.message}`);
            }
        }

        reject(new Error("Please check your NTP connectivity, couldn't connect to any host."));
    });
};
