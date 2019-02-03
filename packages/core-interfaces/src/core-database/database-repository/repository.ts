export interface IRepository {

    estimate() : Promise<number>;

    truncate(): Promise<void>;

    insert(item: any | any[]) : Promise<void>;

    update(item: any | any[]) : Promise<void>;

}
