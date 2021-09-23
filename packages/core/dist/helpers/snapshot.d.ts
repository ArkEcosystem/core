import { Container } from "@arkecosystem/core-interfaces";
import envPaths from "env-paths";
export declare const setUpLite: (options: any, paths: envPaths.Paths) => Promise<Container.IContainer>;
export declare const chooseSnapshot: (flags: Record<string, any>, message: string) => Promise<void>;
