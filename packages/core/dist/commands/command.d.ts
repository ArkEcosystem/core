import { Container } from "@arkecosystem/core-interfaces";
import Command from "@oclif/command";
import { Paths } from "env-paths";
import { CommandFlags, Options } from "../types";
export declare abstract class BaseCommand extends Command {
    static flagsNetwork: Record<string, object>;
    static flagsBehaviour: Record<string, object>;
    static flagsForger: Record<string, object>;
    static flagsSnapshot: Record<string, object>;
    protected tasks: Array<{
        title: string;
        task: any;
    }>;
    protected buildPeerOptions(flags: CommandFlags): {
        networkStart: any;
        disableDiscovery: any;
        skipDiscovery: any;
        ignoreMinimumNetworkReach: any;
    };
    protected buildApplication(app: Container.IContainer, flags: CommandFlags, config: Options): Promise<Container.IContainer>;
    protected flagsToStrings(flags: CommandFlags, ignoreKeys?: string[]): string;
    protected addTask(title: string, task: any): this;
    protected runTasks(): Promise<void>;
    protected getPaths(flags: CommandFlags): Promise<Paths>;
    protected parseWithNetwork(command: any): Promise<any>;
    protected abortWithInvalidInput(): void;
    protected buildBIP38(flags: CommandFlags): Promise<Record<string, string>>;
    protected getNetworks(): string[];
    protected isValidNetwork(network: string): boolean;
    protected getNetworksForPrompt(): any;
    protected restartRunningProcessPrompt(processName: string, showPrompt?: boolean): Promise<void>;
    protected restartProcess(processName: string): void;
    protected abortRunningProcess(processName: string): void;
    protected abortStoppedProcess(processName: string): void;
    protected abortErroredProcess(processName: string): void;
    protected abortUnknownProcess(processName: string): void;
    protected abortMissingProcess(processName: string): void;
    private getEnvPaths;
}
