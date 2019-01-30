// import { Container as container } from "@arkecosystem/core-interfaces";
import { Application } from "./application";
export * from "./service-provider";
export * from "./contracts";

const app: Application = new Application();

export { app };
