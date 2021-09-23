export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeSuccessfulResponse(): R;
            toBePaginated(): R;
        }
    }
}
