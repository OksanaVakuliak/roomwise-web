import { type ApiError, parseApiError } from './errors';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly apiError: ApiError;

  constructor(status: number, body: unknown) {
    const apiError = parseApiError(body);
    super(apiError.code);
    this.name = 'ApiRequestError';
    this.status = status;
    this.apiError = apiError;
  }
}
