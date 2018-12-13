import pino from "pino";

export const logger = pino({
    name: "ark-tester-cli",
    safe: true,
    prettyPrint: true,
});
