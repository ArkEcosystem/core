import { Application } from "./application";
import { container } from "./container";
import * as Contracts from "./contracts";
import * as Enums from "./enums";
import * as Exceptions from "./exceptions";
import * as Container from "./ioc";
import * as Providers from "./providers";
import * as Services from "./services";
import * as Support from "./support";
import * as Types from "./types";
import * as Utils from "./utils";

// @ts-ignore - check if we can get rid of this error or need to disable the init rule
const app: Contracts.Kernel.Application = new Application(container);

export { app, Contracts, Enums, Exceptions, Container, Providers, Services, Support, Types, Utils };
