import { Blocks, Managers } from "@arkecosystem/crypto";

import { genesisBlock as GB } from "../config/genesisBlock";

Managers.configManager.setFromPreset("unitnet");

export const genesisBlock = Blocks.BlockFactory.fromData(GB);
