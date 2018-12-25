export interface IRepository {
    database: any;
    cache: any;
    model: any;
    query: any;
    columns: string[];

    getModel(): object;
}
