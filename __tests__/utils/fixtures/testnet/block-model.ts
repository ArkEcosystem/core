import { Blocks, Managers } from "@arkecosystem/crypto";
import { genesisBlock as GB } from "../../config/testnet/genesisBlock";

Managers.configManager.setFromPreset("testnet");
Managers.configManager.getMilestone().aip11 = false;

export const genesisBlock = Blocks.BlockFactory.fromData(GB);

Managers.configManager.getMilestone().aip11 = true;
