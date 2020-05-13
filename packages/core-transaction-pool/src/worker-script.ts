import { Utils as AppUtils } from "@arkecosystem/core-kernel";

import { WorkerScriptHandler } from "./worker-script-handler";

const ipcHandler = new AppUtils.IpcHandler(new WorkerScriptHandler());
ipcHandler.handleAction("loadCryptoPackage");
ipcHandler.handleAction("setHeight");
ipcHandler.handleAction("setNetworkConfig");
ipcHandler.handleAction("setMilestone");
ipcHandler.handleRequest("getTransactionFromData");
