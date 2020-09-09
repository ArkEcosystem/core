import { Identifiers } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { PaginationService } from "./pagination-service";
import { StandardCriteriaService } from "./standard-criteria-service";

/**
 * @export
 * @class ServiceProvider
 * @extends {ServiceProvider}
 */
export class ServiceProvider extends BaseServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.bind<StandardCriteriaService>(Identifiers.StandardCriteriaService).to(StandardCriteriaService);
        this.app.bind<PaginationService>(Identifiers.PaginationService).to(PaginationService);
    }
}
