import { Application } from "./application";
import * as Contracts from "./contracts";
import * as Enums from "./enums";
import * as Services from "./services";
import * as Support from "./support";
import * as Types from "./types";

const app: Contracts.Kernel.IApplication = new Application();

export { app, Contracts, Enums, Services, Support, Types };
