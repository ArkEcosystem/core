export class InvalidUserInputError extends Error {
  public name: string = 'InvalidUserInputError';

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, InvalidUserInputError);
  }
}
