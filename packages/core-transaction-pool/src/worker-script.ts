import { Utils as AppUtils } from "@arkecosystem/core-kernel";

import { WorkerScriptHandler } from "./worker-script-handler";

const ipcHandler = new AppUtils.IpcHandler(new WorkerScriptHandler());
ipcHandler.handleAction("loadCryptoPackage");
ipcHandler.handleAction("setConfig");
ipcHandler.handleAction("setHeight");
ipcHandler.handleRequest("getTransactionFromData");
