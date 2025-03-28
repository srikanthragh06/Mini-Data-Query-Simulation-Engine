import { NextFunction, Request, Response } from "express";
import { llmClient, llmModelName } from "../llm/client";
import { sendSuccessResponse } from "../utils/responseTemplates";

/**
 * Handles incoming requests to translate natural language queries into SQL queries.
 * @param req The HTTP request object containing the query in the body.
 * @param res The HTTP response object to send the response.
 * @param next The next middleware function in the Express stack.
 */
export const queryHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract the query from the request body
        const { query }: { query: string } = req.body;

        // Send the query to the language model client to get the SQL translation
        const llmResponse = await llmClient.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI that translates natural language queries into SQL queries. 
                    Ensure the SQL output is properly structured.
                    Only return the SQL query, no new lines or code segments or special characters.`,
                },
                {
                    role: "user",
                    content: `Convert this into SQL: "${query}"`,
                },
            ],
            temperature: 1.0, // Sampling temperature for randomness
            top_p: 1.0, // Nucleus sampling parameter
            max_tokens: 1000, // Maximum tokens in the generated response
            model: llmModelName, // Model name to use for the completion
        });

        // Extract the generated SQL query from the language model response
        const responseMessage = llmResponse.choices[0].message.content;

        // Send a success response with the translated SQL query
        return sendSuccessResponse(
            req,
            res,
            "Query translated successfully to SQL!",
            200,
            {
                sqlQuery: responseMessage,
            }
        );
    } catch (err) {
        // Pass any errors to the next middleware for handling
        next(err);
    }
};
