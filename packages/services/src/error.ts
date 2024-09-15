export enum ApiErrorType {
  NotFound = 'Not Found',
  InternalServerError = 'Internal Server Error',
  InvalidRequest = 'Invalid Request',
  Conflict = 'Conflict',
}

export class ServiceError extends Error {
  status: number;
  statusText: string;
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
}
