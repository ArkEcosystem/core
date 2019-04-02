import { PinoLogger } from "../../../packages/core-logger-pino/src";
import { expectLogger } from "../shared/logger";

expectLogger(
    () =>
        new PinoLogger({
            levels: {
                console: "trace",
                file: "trace",
            },
        }),
);
