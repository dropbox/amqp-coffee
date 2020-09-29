export class TimeoutError extends Error {
  public errorno: string;
  public code: string;
  public syscall: string;

  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
    this.errorno = 'ETIMEDOUT'
    this.code = 'ETIMEDOUT'
    this.syscall = 'connect'
  }
}

export class HeartbeatError extends Error {
  public errorno: string;
  public code: string;
  public syscall: string;

  constructor(message: string) {
    super(message)
    this.name = 'HeartbeatError'
    this.errorno = 'EHEARTBEAT'
    this.code = 'EHEARTBEAT'
    this.syscall = 'connect'
  }
}

export class ServerErrorMismatch extends Error {
  public code: string;

  constructor(args: { versionMajor: number, versionMinor: number }) {
    super(`server version: ${args.versionMajor}.${args.versionMinor}`)
    this.name = 'ServerErrorMismatch'
    this.code = 'ESERVERMISMATCH'
  }
}

export class ServerError extends Error {
  public code: number
  public classId: number
  public methodId: number

  constructor(args: { replyCode: number, replyText: string, classId: number, methodId: number }) {
    super(`server error: [${args.replyCode}] ${args.replyText}`)
    this.name = 'ServerError'
    this.code = args.replyCode
    this.classId = args.classId
    this.methodId = args.methodId
  }
}

export class ServerCloseRequest extends Error {
  public code: string;
  public errorno: string;

  constructor(message: string, errorno: string | number) {
    super(message)
    this.name = 'ServerCloseRequest'
    this.code = 'ESERVERCLOSE'
    this.errorno = String(errorno)
  }
}

export class AggregateError extends Error {
  public errors: Error[];
  
  constructor(message = 'aggregate error', innerErrors: Error[] = []) {
    super(message)
    this.name = 'AggregateError'
    this.errors = innerErrors
  }

  public addError(err: Error): void {
    this.errors.push(err)
  }
}

export class BasicReturnError extends Error {
  public readonly code: string
  public readonly replyCode: number
  public readonly exchange: string
  public readonly routingKey: string
  public readonly replyText: string

  constructor(args: { replyCode: number, exchange: string, routingKey: string, replyText: string }) {
    super(args.replyText)

    this.code = 'ERR_AMQP_BASIC_RETURN'
    this.name = 'AMQP_BasicReturnError'

    // assign properties
    this.replyCode = args.replyCode
    this.exchange = args.exchange
    this.routingKey = args.routingKey
    this.replyText = args.replyText
  }
}