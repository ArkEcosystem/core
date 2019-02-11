export const defaults = {
    host: process.env.CORE_VOTE_REPORT_HOST || "0.0.0.0",
    port: process.env.CORE_VOTE_REPORT_PORT || 4006,
    delegateRows: process.env.CORE_VOTE_REPORT_DELEGATE_ROWS || 80,
};
