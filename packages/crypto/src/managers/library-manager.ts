import { CryptoToolsManager } from "../crypto/index";
import { Network } from "../interfaces";
import { Libraries } from "../interfaces/libraries";
import { NetworkUtils } from "../utils";
import { MilestoneManager, NetworkConfigManager } from ".";
import { HeightTracker } from "./height-tracker";

export class LibraryManager<T> {
    public Libraries: Libraries;
    public Crypto: CryptoToolsManager<T>;
    public Utils: NetworkUtils<T>;

    public constructor(
        libraries: Libraries,
        network: Network,
        networkConfigManager: NetworkConfigManager<T>,
        milestoneManager: MilestoneManager<T>,
        heightTracker: HeightTracker,
    ) {
        this.Libraries = libraries;
        this.Crypto = new CryptoToolsManager(libraries, network, milestoneManager, heightTracker);
        this.Utils = new NetworkUtils(networkConfigManager, milestoneManager);
    }
}
