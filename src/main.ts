import dotenv from "dotenv";
import express, { Request, Response } from "express";
import http from "http";
import {
    globalErrorHandler,
    incorrectJSONFormatHandler,
    urlNotFoundHandler,
} from "./middlewares/handlers";
import { logRequest } from "./utils/logging";
import { sendSuccessResponse } from "./utils/responseTemplates";
import queryRouter from "./routes/query";
import { openDB } from "./db/db";

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to log incoming requests
app.use(logRequest);

// Middleware to handle incorrect JSON format errors
app.use(incorrectJSONFormatHandler);

/**
 * Health check endpoint to ensure the server is running
 * @route GET /health
 * @returns A success message indicating server health
 */
app.get("/health", (req: Request, res: Response) => {
    return sendSuccessResponse(req, res, "I'm fine!", 200);
});

// Main router to handle query-related requests
app.use("/", queryRouter);

// Middleware to handle non-existent URLs
app.use("/*", urlNotFoundHandler);

// Global error handler middleware
app.use(globalErrorHandler);

// Start the server on the specified port
const PORT = 4000;
server.listen(PORT, async () => {
    console.log(`Server started successfully on PORT:${PORT}`);

    // Open the database
    await openDB();
    console.log("Database connection opened successfully");
});
