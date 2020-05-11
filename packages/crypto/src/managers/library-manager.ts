import { CryptoToolsManager } from "../crypto/index";
import { Network } from "../interfaces";
import { Libraries } from "../interfaces/libraries";
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
