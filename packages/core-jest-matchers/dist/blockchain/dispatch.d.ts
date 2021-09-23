export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toDispatch(dispatcher: object, value: string): R;
        }
    }
}
