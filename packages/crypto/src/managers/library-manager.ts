import { CryptoTools } from "../crypto/index";
import { Libraries } from "../crypto/interfaces";
import { Network } from "../interfaces";
import { NetworkUtils } from "../utils";
import { ConfigManager, MilestoneManager } from ".";
import { libraryDefaults } from "./defaults";

export class LibraryManager {
    public libraries: Libraries;
    public Crypto: CryptoTools;
    public Utils: NetworkUtils;

    public constructor(
        libraries: Libraries,
        network: Network,
        configManager: ConfigManager,
        milestoneManager: MilestoneManager,
    ) {
        this.libraries = libraries;
        this.Crypto = new CryptoTools(libraries, network, milestoneManager);
        this.Utils = new NetworkUtils(configManager, milestoneManager);
    }
}
