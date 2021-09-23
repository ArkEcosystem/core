export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toExecuteOnEntry(transition: object): R;
        }
    }
}
