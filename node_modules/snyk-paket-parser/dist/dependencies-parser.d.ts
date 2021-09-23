interface Options {
    [name: string]: string;
}
interface Source {
    url: string;
    options: Options;
}
interface DependencyGroup {
    name: string | null;
    options: Options;
    sources: Source[];
    dependencies: Dependency[];
}
interface Dependency {
    source: string;
}
export interface NugetDependency extends Dependency {
    source: 'nuget';
    name: string;
    versionRange: string;
    options: Options;
}
export interface PaketDependencies extends Array<DependencyGroup> {
}
export declare function parseDependenciesFile(input: string): PaketDependencies;
export {};
