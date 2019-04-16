import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { existsSync, readFileSync } from "fs";
import { validateJSON } from "./validate-json";

export const restorePeers = (): any[] => {
    const path: string = `${process.env.CORE_PATH_CACHE}/peers.json`;

    if (!existsSync(path)) {
        return [];
    }

    try {
        const peers: Array<{ ip: string; port: number; version: string }> = JSON.parse(
            readFileSync(path, { encoding: "utf8" }),
        );

        const { error } = validateJSON(peers, {
            type: "array",
            items: {
                type: "object",
                properties: {
                    ip: {
                        type: "string",
                        format: "ip",
                    },
                    port: {
                        type: "integer",
                        minimum: 1,
                        maximum: 65535,
                    },
                    version: {
                        type: "string",
                        maxLength: 16,
                    },
                },
                required: ["ip", "port", "version"],
            },
        });

        if (error) {
            app.resolvePlugin<Logger.ILogger>("logger").warn("Ignoring corrupt peers from cache.");

            return [];
        }

        return peers;
    } catch (error) {
        return [];
    }
};
