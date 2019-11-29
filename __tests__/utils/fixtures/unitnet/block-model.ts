import { Blocks, Managers } from "@arkecosystem/crypto";
import { genesisBlock as GB } from "../../config/unitnet/genesisBlock";

Managers.configManager.setFromPreset("unitnet");
Managers.configManager.getMilestone().aip11 = false;

export const genesisBlock = Blocks.BlockFactory.fromData(GB);

Managers.configManager.getMilestone().aip11 = true;
