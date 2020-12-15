import { workerData } from "worker_threads";

import { GenerateLog, Options as GenerateLogOptions } from "./actions/generate-log";

const main = async () => {
    const action = new GenerateLog(workerData as GenerateLogOptions);

    await action.execute();
};

main();
