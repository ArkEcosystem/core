import { resolve } from "path";

export const opts = {
    data: "~/.ark",
    config: resolve(__dirname, "./config"),
    token: "ark",
    network: "testnet",
};

export const version = "2.0.0";
