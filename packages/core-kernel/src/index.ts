import { Application } from "./application";
import * as Contracts from "./contracts";
import * as Enums from "./enums";
import * as Exceptions from "./exceptions";
import * as Services from "./services";
import * as Support from "./support";
import * as Types from "./types";

const app: Contracts.Kernel.IApplication = new Application();

export { app, Contracts, Enums, Exceptions, Services, Support, Types };
