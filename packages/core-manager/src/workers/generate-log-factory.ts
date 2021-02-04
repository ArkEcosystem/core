import { GenerateLog } from "../contracts";
import { GenerateLogGz } from "./generate-log-gz";
import { GenerateLogZip } from "./generate-log-zip";

export const generateLogFactory: GenerateLog.GenerateLogFactory = (options) => {
    if (options.archiveFormat === "gz") {
        return new GenerateLogGz(options);
    }

    return new GenerateLogZip(options);
};
