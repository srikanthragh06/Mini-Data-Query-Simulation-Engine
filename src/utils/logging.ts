import { NextFunction, Request, Response } from "express";

/**
 * Logs a received request to the console.
 * @param req The request.
 * @param _ The response (not used).
 * @param next The next middleware function.
 */
export const logRequest = (
    req: Request,
    _: Response,
    next: NextFunction
): void => {
    const timestamp = new Date().toLocaleString();

    // Log the request in the format:
    // REQUEST | Timestamp | Method | URL
    const logMsg = `REQUEST | ${timestamp} | ${req.method} | ${req.originalUrl}`;
    console.log(logMsg);

    // Call the next middleware function
    next();
};

/**
 * Logs the response details to the console.
 * @param req - The request object.
 * @param resMessage - The response message to log.
 * @param statusCode - The status code of the response. Defaults to 200.
 */
export const logResponse = (
    req: Request,
    resMessage: string,
    statusCode = 200
): void => {
    const timestamp = new Date().toLocaleString();

    // RESPONSE | Status Code | Timestamp | Method | URL | Response Message
    const logMsg = `RESPONSE | ${statusCode} | ${timestamp} | ${req.method} | ${req.originalUrl} | ${resMessage}`;

    console.log(logMsg);
};
