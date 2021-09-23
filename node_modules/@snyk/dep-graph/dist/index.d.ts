import 'source-map-support/register';
export { DepGraph, DepGraphData, Pkg, PkgInfo, PkgManager, VersionProvenance, } from './core/types';
export { createFromJSON } from './core/create-from-json';
export { DepGraphBuilder } from './core/builder';
import * as Errors from './core/errors';
export { Errors };
import * as legacy from './legacy';
export { legacy };
