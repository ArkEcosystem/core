import { CryptoTools } from "../crypto/index";
import { Libraries } from "../crypto/interfaces";
import { Network } from "../interfaces";
import { NetworkUtils } from "../utils";
import { ConfigManager, MilestoneManager } from ".";

export class LibraryManager<T> {
    public libraries: Libraries;
    public Crypto: CryptoTools<T>;
    public Utils: NetworkUtils<T>;

    public constructor(
        libraries: Libraries,
        network: Network,
        configManager: ConfigManager<T>,
        milestoneManager: MilestoneManager<T>,
    ) {
        this.libraries = libraries;
        this.Crypto = new CryptoTools(libraries, network, milestoneManager);
        this.Utils = new NetworkUtils(configManager, milestoneManager);
    }
}
