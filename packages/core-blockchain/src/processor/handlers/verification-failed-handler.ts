import { Container } from "@arkecosystem/core-kernel";

import { BlockHandler } from "./block-handler";

// todo: remove the abstract and instead require a contract to be implemented
@Container.injectable()
export class VerificationFailedHandler extends BlockHandler {}
