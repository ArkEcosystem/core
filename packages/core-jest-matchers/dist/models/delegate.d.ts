export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeDelegate(): R;
        }
    }
}
