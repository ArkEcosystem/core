import { app, Contracts } from "@arkecosystem/core-kernel";
import dns from "dns";
import shuffle from "lodash.shuffle";
import util from "util";

export const checkDNS = async hosts => {
    hosts = shuffle(hosts);

    const lookupService = util.promisify(dns.lookupService);

    for (let i = hosts.length - 1; i >= 0; i--) {
        try {
            await lookupService(hosts[i], 53);

            return Promise.resolve(hosts[i]);
        } catch (err) {
            app.get<Contracts.Kernel.Log.ILogger>("log").error(err.message);
        }
    }

    return Promise.reject(new Error("Please check your network connectivity, couldn't connect to any host."));
};
