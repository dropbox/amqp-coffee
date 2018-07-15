export class TimeoutError extends Error {
  public errorno: string;
  public code: string;
  public syscall: string;

  constructor(message: string) {
    super(message);
    this.errorno = 'ETIMEDOUT';
    this.code = 'ETIMEDOUT';
    this.syscall = 'connect';
  }
}
