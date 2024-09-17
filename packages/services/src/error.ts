export enum ApiErrorType {
  InvalidRequest = 'Invalid Request',
  NotFound = 'Not Found',
  Conflict = 'Conflict',
  InternalServerError = 'Internal Server Error',
  BadGateway = 'Bad Gateway',
}

export class ServiceError extends Error {
  status: number;
  statusText: string;
  expose = true;
  constructor(type: ApiErrorType, message: string) {
    super(message);
    this.statusText = type;
    switch (type) {
      case ApiErrorType.NotFound:
        this.status = 404;
        break;
      case ApiErrorType.InvalidRequest:
        this.status = 400;
        break;
      case ApiErrorType.Conflict:
        this.status = 409;
        break;
      case ApiErrorType.BadGateway:
        this.status = 502;
        break;
      default:
        this.status = 500;
    }
  }
  static NotFound(message: string) {
    return new ServiceError(ApiErrorType.NotFound, message);
  }
  static InternalServerError(message: string) {
    return new ServiceError(ApiErrorType.InternalServerError, message);
  }
  static InvalidRequest(message: string) {
    return new ServiceError(ApiErrorType.InvalidRequest, message);
  }
  static Conflict(message: string) {
    return new ServiceError(ApiErrorType.Conflict, message);
  }
  static BadGateway(message: string) {
    return new ServiceError(ApiErrorType.BadGateway, message);
  }
}
