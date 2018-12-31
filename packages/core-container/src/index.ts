import { Container } from "@arkecosystem/core-interfaces";
import { ContainerImpl } from "./container";

const app: Container.Container = new ContainerImpl();
export { app };
