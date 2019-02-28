import pino from "pino";

export const logger = pino({
    name: "core-tester-cli",
    safe: true,
    prettyPrint: true,
});
