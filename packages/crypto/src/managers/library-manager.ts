import { CryptoTools } from "../crypto/index";
import { Libraries } from "../crypto/interfaces";
import { Keys } from "../identities/keys";
import { Network } from "../interfaces";
import { Utils } from "../utils";
import { ConfigManager, MilestoneManager } from ".";
import { libraryDefaults } from "./defaults";

export class LibraryManager {
    public libraries: Libraries;
    public Crypto: CryptoTools;
    public Utils: Utils;

    public constructor(
        libraries = libraryDefaults,
        keys: Keys,
        network: Network,
        configManager: ConfigManager,
        milestoneManager: MilestoneManager,
    ) {
        this.libraries = libraries;
        this.Crypto = new CryptoTools(libraries, keys, network, milestoneManager);
        this.Utils = new Utils(configManager, milestoneManager);
    }
}
