export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeAddress(): R;
        }
    }
}
