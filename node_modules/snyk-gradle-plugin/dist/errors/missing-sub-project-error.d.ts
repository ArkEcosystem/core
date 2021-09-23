export declare class MissingSubProjectError extends Error {
    name: string;
    subProject: string;
    allProjects: string[];
    constructor(subProject: string, allProjects: string[]);
}
