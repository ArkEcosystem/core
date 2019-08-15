import { Application } from "./application";
import * as Contracts from "./contracts";
import * as Enums from "./support";
import * as Support from "./support";

const app: Contracts.Kernel.IApplication = new Application();

export { app, Contracts, Enums, Support };
