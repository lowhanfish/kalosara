export type AccessErrorStatus = 401 | 403 | 409 | 429 | 503;

export class AccessError extends Error {
  constructor(
    public readonly status: AccessErrorStatus,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AccessError';
  }
}

export class CmsError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CmsError';
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
