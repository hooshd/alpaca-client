import { Request, Response, NextFunction } from 'express';

interface ApiError extends Error {
    status?: number;
    code?: string;
}

export const errorHandler = (
    err: ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('Error:', err);

    // Default to 500 server error
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: {
            message,
            code: err.code,
            status
        }
    });
};
