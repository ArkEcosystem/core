import { monitor } from "../../../../monitor";

export const getNetworkState = async () => ({
    data: await monitor.getNetworkState(),
});
