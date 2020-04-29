import { CryptoToolsManager } from "../crypto/index";
import { Libraries } from "../crypto/interfaces";
import { Network } from "../interfaces";
import { NetworkUtils } from "../utils";
import { MilestoneManager, NetworkConfigManager } from ".";

export class LibraryManager<T> {
    public Libraries: Libraries;
    public Crypto: CryptoToolsManager<T>;
    public Utils: NetworkUtils<T>;

    public constructor(
        libraries: Libraries,
        network: Network,
        networkConfigManager: NetworkConfigManager<T>,
        milestoneManager: MilestoneManager<T>,
    ) {
        this.Libraries = libraries;
        this.Crypto = new CryptoToolsManager(libraries, network, milestoneManager);
        this.Utils = new NetworkUtils(networkConfigManager, milestoneManager);
    }
}
