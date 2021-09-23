export declare function execute(command: string, args: string[], options: {
    cwd?: string;
}, perLineCallback?: (s: string) => Promise<void>): Promise<string>;
