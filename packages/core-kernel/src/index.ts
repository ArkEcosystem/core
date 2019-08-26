import { Application } from "./application";
import * as Contracts from "./contracts";
import * as Enums from "./enums";
import * as Exceptions from "./exceptions";
import * as IoC from "./ioc";
import * as Services from "./services";
import * as Support from "./support";
import * as Types from "./types";
import * as Utils from "./utils";

const container: IoC.interfaces.Container = new IoC.Container();
const app: Contracts.Kernel.IApplication = new Application(container);

export { app, container, Contracts, Enums, Exceptions, IoC, Services, Support, Types, Utils };
