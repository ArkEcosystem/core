import { Application } from "./application";
import * as Contracts from "./contracts";
import * as Support from "./support";

const app: Contracts.Kernel.IApplication = new Application();

export { app, Contracts, Support };
