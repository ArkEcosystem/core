export interface Repository {
    databaseService: any;
    cache: any;
    model: any;
    query: any;
    columns: string[];

    getModel(): object;
}

export interface Resource {
    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    raw(resource): object;

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    transform(resource): object;
}
