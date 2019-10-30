import { Blocks, Managers } from "@arkecosystem/crypto";

Managers.configManager.setFromPreset("unitnet");
Managers.configManager.getMilestone().aip11 = false;

export const genesisBlock = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));

Managers.configManager.getMilestone().aip11 = true;
