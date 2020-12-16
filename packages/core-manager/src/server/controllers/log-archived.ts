import { Container, Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import { join } from "path";

@Container.injectable()
export class LogArchivedController {
    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public async file(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const logsPath = join(process.env.CORE_PATH_DATA!, "log-archive");
        const fileName = request.params.id;

        const file = await this.filesystem.get(join(logsPath, fileName));

        return h
            .response(file)
            .header("Content-Type", "application/gzip")
            .header("Content-Encoding", "gzip")
            .header("Content-Disposition", "attachment; filename= " + fileName);
    }
}
