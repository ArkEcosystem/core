import { WinstonLogger } from "../../../packages/core-logger-winston/src";
import { expectLogger } from "../shared/logger";

expectLogger(
    () =>
        new WinstonLogger({
            transports: [
                {
                    constructor: "Console",
                    options: {
                        level: "debug",
                    },
                },
            ],
        }),
);
