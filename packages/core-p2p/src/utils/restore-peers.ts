import { existsSync } from "fs";
import { config } from "../config";

export const restorePeers = (): void => {
    const path = `${process.env.CORE_PATH_CACHE}/peers.json`;
    if (existsSync(path)) {
        const peers = require(path);
        config.set("peers", peers);
    }
};
