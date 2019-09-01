import "jest-extended";

import { ConsoleLogger } from "@packages/core-kernel/src/services/log/drivers/console";
import { expectLogger } from "../../../../shared/logger";

expectLogger(ConsoleLogger, {});
