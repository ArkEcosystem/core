import { Libraries } from "./crypto/interfaces";
import { Identities } from "./identities";
import { NetworkConfig } from "./interfaces";
import { ConfigManager, HeightTracker, MilestoneManager, NetworkManager } from "./managers";
import { libraryDefaults } from "./managers/defaults";
import { LibraryManager } from "./managers/library-manager";
import { NetworkName } from "./types";

export class CryptoManager<T> {
    public identities: Identities<T>;
    public libraryManager: LibraryManager<T>;
    public heightTracker: HeightTracker;
    public configManager: ConfigManager<T>;
    public networkManager: NetworkManager;
    public milestoneManager: MilestoneManager<T>;

    public constructor(network: NetworkConfig<T>, private libraries: Libraries) {
        this.libraries = { ...libraryDefaults, ...libraries };
        this.heightTracker = new HeightTracker();
        this.configManager = new ConfigManager(network);
        this.networkManager = new NetworkManager();
        this.milestoneManager = new MilestoneManager(this.heightTracker, network);
        this.libraryManager = new LibraryManager(
            this.libraries,
            network.network,
            this.configManager,
            this.milestoneManager,
        );
        this.identities = new Identities(this.libraryManager, network.network);
    }

    public static createFromConfig<T>(config: NetworkConfig<T>, libraries = libraryDefaults): CryptoManager<T> {
        return new CryptoManager(config, libraries);
    }

    public static createFromPreset<T>(name: NetworkName, libraries = libraryDefaults): CryptoManager<T> {
        return new CryptoManager(NetworkManager.findByName(name), libraries);
    }

    public static getPresets<T>(): Record<NetworkName, NetworkConfig<T>> {
        return NetworkManager.all();
    }
}
