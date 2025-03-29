import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { sendClientSideError } from "../utils/responseTemplates";

export const queryValidation = [
    /**
     * Validation rule for the query parameter.
     * The query parameter is required and must be a maximum of 500 characters.
     */
    body("query")
        .trim()
        .exists({ checkFalsy: true })
        .withMessage("Query is required")
        .isLength({ max: 500 })
        .withMessage("Query can only be a maximum of 500 characters"),
    /**
     * Error handler for the validation rules.
     * If there are any errors, send a 400 Bad Request response with the error message.
     */
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessage = errors.array()[0].msg;
            return sendClientSideError(req, res, errorMessage, 400);
        }
        next();
    },
];

export const validateValidation = [
    /**
     * Validation rule for the query parameter.
     * The query parameter is required and must be a maximum of 500 characters.
     */
    body("query")
        .trim()
        .exists({ checkFalsy: true })
        .withMessage("Query is required")
        .isLength({ max: 500 })
        .withMessage("Query can only be a maximum of 500 characters"),
    /**
     * Error handler for the validation rules.
     * If there are any errors, send a 400 Bad Request response with the error message.
     */
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessage = errors.array()[0].msg;
            return sendClientSideError(req, res, errorMessage, 400);
        }
        next();
    },
];
