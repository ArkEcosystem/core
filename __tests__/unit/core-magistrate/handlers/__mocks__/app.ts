import BridgechainSubHandlers from "@arkecosystem/core-magistrate-transactions/src/handlers/entity-subhandlers/bridgechain";
import BusinessSubHandlers from "@arkecosystem/core-magistrate-transactions/src/handlers/entity-subhandlers/business";
import DeveloperSubHandlers from "@arkecosystem/core-magistrate-transactions/src/handlers/entity-subhandlers/developer";
import PluginCoreSubHandlers from "@arkecosystem/core-magistrate-transactions/src/handlers/entity-subhandlers/plugin-core";
import PluginDesktopSubHandlers from "@arkecosystem/core-magistrate-transactions/src/handlers/entity-subhandlers/plugin-desktop";

const appResolve = {
    [BusinessSubHandlers.BusinessRegisterSubHandler as any]: new BusinessSubHandlers.BusinessRegisterSubHandler(),
    [BusinessSubHandlers.BusinessResignSubHandler as any]: new BusinessSubHandlers.BusinessResignSubHandler(),
    [BusinessSubHandlers.BusinessUpdateSubHandler as any]: new BusinessSubHandlers.BusinessUpdateSubHandler(),
    [BridgechainSubHandlers.BridgechainRegisterSubHandler as any]: new BridgechainSubHandlers.BridgechainRegisterSubHandler(),
    [BridgechainSubHandlers.BridgechainResignSubHandler as any]: new BridgechainSubHandlers.BridgechainResignSubHandler(),
    [BridgechainSubHandlers.BridgechainUpdateSubHandler as any]: new BridgechainSubHandlers.BridgechainUpdateSubHandler(),
    [DeveloperSubHandlers.DeveloperRegisterSubHandler as any]: new DeveloperSubHandlers.DeveloperRegisterSubHandler(),
    [DeveloperSubHandlers.DeveloperResignSubHandler as any]: new DeveloperSubHandlers.DeveloperResignSubHandler(),
    [DeveloperSubHandlers.DeveloperUpdateSubHandler as any]: new DeveloperSubHandlers.DeveloperUpdateSubHandler(),
    [PluginCoreSubHandlers.PluginCoreRegisterSubHandler as any]: new PluginCoreSubHandlers.PluginCoreRegisterSubHandler(),
    [PluginCoreSubHandlers.PluginCoreResignSubHandler as any]: new PluginCoreSubHandlers.PluginCoreResignSubHandler(),
    [PluginCoreSubHandlers.PluginCoreUpdateSubHandler as any]: new PluginCoreSubHandlers.PluginCoreUpdateSubHandler(),
    [PluginDesktopSubHandlers.PluginDesktopRegisterSubHandler as any]: new PluginDesktopSubHandlers.PluginDesktopRegisterSubHandler(),
    [PluginDesktopSubHandlers.PluginDesktopResignSubHandler as any]: new PluginDesktopSubHandlers.PluginDesktopResignSubHandler(),
    [PluginDesktopSubHandlers.PluginDesktopUpdateSubHandler as any]: new PluginDesktopSubHandlers.PluginDesktopUpdateSubHandler(),
};

export const app = {
    resolve: key => appResolve[key],
};
