import { workerData } from "worker_threads";

import { Options as GenerateLogOptions } from "./actions/generate-log";
import { GenerateLogGz } from "./actions/generate-log-gz";

const main = async () => {
    const action = new GenerateLogGz(workerData as GenerateLogOptions);

    await action.execute();
};

main();
