import { Container } from "@arkecosystem/core-kernel";

import { EntityUpdateSubHandler } from "../update";

@Container.injectable()
export class PluginCoreUpdateSubHandler extends EntityUpdateSubHandler {}
