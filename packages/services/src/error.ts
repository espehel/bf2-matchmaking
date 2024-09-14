export enum ApiErrorType {
  NotFound = 'Not Found',
  InternalServerError = 'Internal Server Error',
  InvalidRequest = 'Invalid Request',
}

export class ServiceError extends Error {
  status: number;
  statusText: string;
  constructor(type: ApiErrorType, message: string) {
    super(type);
    switch (type) {
      case ApiErrorType.NotFound:
        this.status = 404;
        this.statusText = type;
        break;
      case ApiErrorType.InvalidRequest:
        this.status = 400;
        this.statusText = type;
        break;
      default:
        this.status = 500;
        this.statusText = type;
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
}
