export declare class Ext {
    private readonly config;
    private readonly routePathPrefix;
    private readonly routes;
    constructor(config: any);
    isValidRoute(request: any): boolean;
    onPreHandler(request: any, h: any): any;
    onPostHandler(request: any, h: any): any;
    hasPagination(request: any): any;
    private getRouteOptions;
}
