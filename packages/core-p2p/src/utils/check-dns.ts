import { app } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import dns from "dns";
import shuffle from "lodash/shuffle";
import util from "util";

const logger = app.resolvePlugin<AbstractLogger>("logger");

export = async hosts => {
    hosts = shuffle(hosts);

    const lookupService = util.promisify(dns.lookupService);

    for (let i = hosts.length - 1; i >= 0; i--) {
        try {
            await lookupService(hosts[i], 53);

            return Promise.resolve(hosts[i]);
        } catch (err) {
            logger.error(err.message);
        }
    }

    return Promise.reject(new Error("Please check your network connectivity, couldn't connect to any host."));
};
