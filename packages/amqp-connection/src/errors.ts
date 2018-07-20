// tslint:disable:max-classes-per-file

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

export class HeartbeatError extends Error {
  public errorno: string;
  public code: string;
  public syscall: string;

  constructor(message: string) {
    super(message);
    this.errorno = 'EHEARTBEAT';
    this.code = 'EHEARTBEAT';
    this.syscall = 'connect';
  }
}

export class ServerErrorMismatch extends Error {
  public code: string;

  constructor(args: { versionMajor: number, versionMinor: number }) {
    super(`server version: ${args.versionMajor}.${args.versionMinor}`);
    this.code = 'ESERVERMISMATCH';
  }
}

export class ServerCloseRequest extends Error {
  public code: string;
  public errorno: string;

  constructor(message: string, errorno: string) {
    super(message);
    this.code = 'ESERVERCLOSE';
    this.errorno = errorno;
  }
}
