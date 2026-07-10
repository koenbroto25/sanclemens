// packages/core/src/lib/middleware/errors.ts

export class ForbiddenError extends Error {
    public code: string;
    public status: number;

    constructor(message: string, code: string = 'FORBIDDEN', status: number = 403) {
        super(message);
        this.name = 'ForbiddenError';
        this.code = code;
        this.status = status;
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class NotFoundError extends Error {
    public code: string;
    public status: number;

    constructor(message: string, code: string = 'NOT_FOUND', status: number = 404) {
        super(message);
        this.name = 'NotFoundError';
        this.code = code;
        this.status = status;
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

// Add other common error classes here as needed