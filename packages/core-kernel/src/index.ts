import { Application } from "./application";
import * as Contracts from "./contracts";
import * as Enums from "./enums";
import * as Exceptions from "./exceptions";
import * as Container from "./container";
import * as Providers from "./providers";
import * as Services from "./services";
import * as Support from "./support";
import * as Types from "./types";
import * as Utils from "./utils";

const container: Container.interfaces.Container = new Container.Container();
const app: Contracts.Kernel.IApplication = new Application(container);

export { app, container, Contracts, Enums, Exceptions, Container, Providers, Services, Support, Types, Utils };
