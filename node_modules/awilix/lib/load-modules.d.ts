import { ModuleDescriptor, GlobWithOptions, listModules } from './list-modules';
import { BuildResolverOptions } from './resolvers';
import { AwilixContainer } from './container';
/**
 * The options when invoking loadModules().
 * @interface LoadModulesOptions
 */
export interface LoadModulesOptions {
    cwd?: string;
    formatName?: NameFormatter | BuiltInNameFormatters;
    resolverOptions?: BuildResolverOptions<any>;
}
/**
 * Name formatting options when using loadModules().
 * @type BuiltInNameFormatters
 */
export declare type BuiltInNameFormatters = 'camelCase';
/**
 * Takes in the filename of the module being loaded as well as the module descriptor,
 * and returns a string which is used to register the module in the container.
 *
 * `descriptor.name` is the same as `name`.
 *
 * @type {NameFormatter}
 */
export declare type NameFormatter = (name: string, descriptor: ModuleDescriptor) => string;
/**
 * Dependencies for `loadModules`
 */
export interface LoadModulesDeps {
    listModules: typeof listModules;
    container: AwilixContainer;
    require(path: string): any;
}
/**
 * Given an array of glob strings, will call `require`
 * on them, and call their default exported function with the
 * container as the first parameter.
 *
 * @param  {AwilixContainer} dependencies.container
 * The container to install loaded modules in.
 *
 * @param  {Function} dependencies.listModules
 * The listModules function to use for listing modules.
 *
 * @param  {Function} dependencies.require
 * The require function - it's a dependency because it makes testing easier.
 *
 * @param  {String[]} globPatterns
 * The array of globs to use when loading modules.
 *
 * @param  {Object} opts
 * Passed to `listModules`, e.g. `{ cwd: '...' }`.
 *
 * @param  {(string, ModuleDescriptor) => string} opts.formatName
 * Used to format the name the module is registered with in the container.
 *
 * @return {Object}
 * Returns an object describing the result.
 */
export declare function loadModules(dependencies: LoadModulesDeps, globPatterns: string | Array<string | GlobWithOptions>, opts?: LoadModulesOptions): {
    loadedModules: ModuleDescriptor[];
};
