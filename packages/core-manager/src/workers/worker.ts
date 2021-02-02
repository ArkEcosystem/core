import { workerData } from "worker_threads";

import { generateLogFactory } from "./actions/generate-log-factory";

const main = async () => {
    const action = generateLogFactory(workerData);

    await action.execute();
};

main();
