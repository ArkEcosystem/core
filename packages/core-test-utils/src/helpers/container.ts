import { app } from "@arkecosystem/core-container";
import * as path from "path";

export default {
  setup: async (options: any): Promise<any> => {
    return app.setUp(
      "2.0.0",
      {
        data: options.data || "~/.ark",
        config: options.config
          ? options.config
          : path.resolve(__dirname, "../config/testnet"),
        token: options.token || "ark",
        network: options.network || "testnet"
      },
      options
    );
  }
}
