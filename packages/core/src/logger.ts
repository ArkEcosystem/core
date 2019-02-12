import Pino from "pino";

export const logger = Pino({
    name: "core",
    prettyPrint: true,
});
