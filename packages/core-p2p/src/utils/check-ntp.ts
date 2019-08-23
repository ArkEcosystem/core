import { app, Contracts } from "@arkecosystem/core-kernel";
import Sntp from "@hapi/sntp";
import shuffle from "lodash.shuffle";

export const checkNTP = (hosts, timeout = 1000): any => {
    return new Promise(async (resolve, reject) => {
        for (const host of shuffle(hosts)) {
            try {
                const time: Sntp.TimeOptions = await Sntp.time({ host, timeout });

                return resolve({ time, host });
            } catch (err) {
                app.resolve<Contracts.Kernel.Log.ILogger>("log").error(`Host ${host} responsed with: ${err.message}`);
            }
        }

        reject(new Error("Please check your NTP connectivity, couldn't connect to any host."));
    });
};
