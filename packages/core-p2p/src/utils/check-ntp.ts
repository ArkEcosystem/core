import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import Sntp from "@hapi/sntp";
import shuffle from "lodash.shuffle";

export const checkNTP = (hosts, timeout = 1000): any => {
    const logger = app.resolvePlugin<Logger.ILogger>("logger");

    return new Promise(async (resolve, reject) => {
        for (const host of shuffle(hosts)) {
            try {
                const time: Sntp.TimeOptions = await Sntp.time({ host, timeout });

                return resolve({ time, host });
            } catch (err) {
                logger.error(`Host ${host} responsed with: ${err.message}`);
            }
        }

        reject(new Error("Please check your NTP connectivity, couldn't connect to any host."));
    });
};
