import { workerData } from "worker_threads";

import { generateLogFactory } from "./generate-log-factory";

const main = async () => {
    const action = generateLogFactory(workerData);

    await action.execute();
};

main();
