export declare class Environment {
    private readonly variables;
    constructor(variables: Record<string, any>);
    setUp(): void;
    merge(variables: object): void;
    private exportPaths;
    private exportVariables;
}
