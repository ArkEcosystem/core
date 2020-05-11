import { IdentitiesManager } from "./identities";
import { Libraries, NetworkConfig } from "./interfaces";
import { HeightTracker, MilestoneManager, NetworkConfigManager } from "./managers";
import { libraryDefaults } from "./managers/defaults";
import { LibraryManager } from "./managers/library-manager";
import * as networks from "./networks";
import { NetworkName } from "./types";

export class CryptoManager<T> {
    public Identities: IdentitiesManager<T>;
    public LibraryManager: LibraryManager<T>;
    public HeightTracker: HeightTracker;
    public NetworkConfigManager: NetworkConfigManager<T>;
    public MilestoneManager: MilestoneManager<T>;
    private libraries: Libraries;

    public constructor(network: NetworkConfig<T>, libraries: Partial<Libraries>) {
        this.libraries = { ...libraryDefaults, ...libraries };
        this.HeightTracker = new HeightTracker();
        this.NetworkConfigManager = new NetworkConfigManager(network);
        this.MilestoneManager = new MilestoneManager(this.HeightTracker, network);
        this.LibraryManager = new LibraryManager(
            this.libraries,
            network.network,
            this.NetworkConfigManager,
            this.MilestoneManager,
        );
        this.Identities = new IdentitiesManager(this.LibraryManager, network.network);
    }

    public static createFromConfig<T>(
        config: NetworkConfig<T>,
        libraries: Partial<Libraries> = libraryDefaults,
    ): CryptoManager<T> {
        return new CryptoManager(config, libraries);
    }

    public static createFromPreset<T>(
        name: NetworkName,
        libraries: Partial<Libraries> = libraryDefaults,
    ): CryptoManager<T> {
        return new CryptoManager(this.findNetworkByName(name), libraries);
    }

    public static getPresets<T>(): Record<NetworkName, NetworkConfig<T>> {
        // @ts-ignore - the newly generated unitnet doesn't match the old configs because it has things like a nonce field
        return (networks as unknown) as Record<NetworkName, NetworkConfig>;
    }

    public static findNetworkByName<T>(name: NetworkName): NetworkConfig<T> {
        return networks[name.toLowerCase()];
    }
}
