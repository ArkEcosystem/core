export class ParseError extends Error {
  public name: string = 'ParseError';

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, ParseError);
  }
}
