import { Container } from "@arkecosystem/core-kernel";

import { EntityRegisterSubHandler } from "../register";

@Container.injectable()
export class PluginCoreRegisterSubHandler extends EntityRegisterSubHandler {}
