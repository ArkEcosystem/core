export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeDelegateResignationType(): R;
        }
    }
}
