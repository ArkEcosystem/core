import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

process.env.CORE_RESET_DATABASE = "1";

export const setUp = async () => setUpContainer({ exit: "@arkecosystem/core-blockchain" });

export const tearDown = async (): Promise<void> => app.tearDown();
