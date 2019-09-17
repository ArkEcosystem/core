import { Container } from "@arkecosystem/core-kernel";

import { BlockHandler } from "./block-handler";

@Container.injectable()
export class VerificationFailedHandler extends BlockHandler {}
