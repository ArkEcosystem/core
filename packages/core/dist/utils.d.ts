import envPaths from "env-paths";
export declare const renderTable: (head: string[], callback: any) => void;
export declare const updateEnvironmentVariables: (envFile: string, variables: Record<string, import("@typeskrift/foreman").ProcessIdentifier>) => void;
export declare const getCliConfig: (flags: Record<string, any>, paths: envPaths.Paths, defaultValue?: {}) => Record<string, any>;
