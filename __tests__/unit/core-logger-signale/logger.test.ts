import { SignaleLogger } from "../../../packages/core-logger-signale/src";
import { expectLogger } from "../shared/logger";

expectLogger(() => new SignaleLogger({ logLevel: "info" }));
