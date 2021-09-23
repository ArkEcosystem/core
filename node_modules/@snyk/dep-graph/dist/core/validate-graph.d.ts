import * as graphlib from 'graphlib';
export declare function validateGraph(graph: graphlib.Graph, rootNodeId: string, pkgs: {
    [pkgId: string]: any;
}, pkgNodes: {
    [nodeId: string]: Set<string>;
}): void;
