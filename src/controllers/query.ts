import { NextFunction, Request, Response } from "express";
import { llmClient, llmModelName } from "../llm/client";
import {
    sendClientSideError,
    sendServerSideError,
    sendSuccessResponse,
} from "../utils/responseTemplates";
import { databaseSchemaDescription, db } from "../db/db";
import { ChatCompletion } from "openai/resources/chat";

/**
 * Validates a natural language query by asking the LLM whether it is meaningful and schema-aligned.
 * @param query The natural language query to validate.
 * @returns An object with the following properties:
 * - `isValid`: A boolean indicating whether the query is valid.
 * - `isAligned`: A boolean indicating whether the query aligns with the schema.
 * - `justification`: A string containing the justification for the validation result.
 * - `isRateLimited`: A boolean indicating whether the validation was rate-limited.
 */
/**
 * The validation process consists of two checks:
 * 1. **Meaningful Data Request**: Ensure the query is a valid natural language request for retrieving data.
 *    It must not be irrelevant, ambiguous, or non-retrieval-based (e.g., commands like DELETE, INSERT, or opinion-based queries).
 * 2. **Schema Alignment**: Ensure the query aligns with the given database schema. The requested fields and tables must exist.
 */
const validateQuery = async (
    query: string
): Promise<{
    isValid: boolean;
    isAligned: boolean;
    justification: string;
    isRateLimited: boolean;
}> => {
    let llmResponse: ChatCompletion & { _request_id?: string | null };
    const llmValidationMessage = await llmClient.chat.completions.create({
        messages: [
            // The system message contains the instructions for the LLM
            {
                role: "system",
                content: `
                    You are an AI that validates natural language queries before they are converted into SQL.
                    Perform the following checks:
                    
                    1. **Meaningful Data Request**: Ensure the query is a valid natural language request for retrieving data. 
                       It must not be irrelevant, ambiguous, or non-retrieval-based (e.g., commands like DELETE, INSERT, or opinion-based queries).
                    
                    2. **Schema Alignment**: Ensure the query aligns with the given database schema. The requested fields and tables must exist.
                    
                    **Response Format:**  
                    - The first word must be ‘yes’ if the query is valid, otherwise ‘no’.  
                    - The second word must be ‘yes’ if the query aligns with the schema, otherwise ‘no’.  
                    - After these two words, provide a justification.

                    The Database is a sqlite database.
                    ${databaseSchemaDescription}
                    
                    Ensure the validation is strict yet reasonable, allowing natural variations in phrasing 
                    while rejecting invalid or irrelevant queries.

                    Allowing Minor Grammatical Errors: Instead of rejecting queries with small grammatical issues, 
                    attempt to normalize them before validation.
                    Providing Suggestions Instead of Rejections: If a query is slightly incorrect but understandable, suggest a corrected version rather than outright rejecting it.
                    Clarifying Expectations: Make it clear that the validation should focus on
                     meaningful retrieval, not strict grammatical correctness.
                    Adding Examples:Provide examples of both valid and invalid queries to
                     guide the validation behavior.`,
            },
            // The user message contains the query to validate
            {
                role: "user",
                content: `Validate this query: "${query}"`,
            },
        ],
        // LLM configuration
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1000,
        model: llmModelName,
    });

    if (
        !llmValidationMessage.choices ||
        llmValidationMessage.choices.length === 0
    ) {
        return {
            isValid: false,
            isAligned: false,
            justification: "Failed to validate query.",
            isRateLimited: false,
        };
    }

    // Extract the validation message from the LLM response
    const validationMessage =
        llmValidationMessage.choices[0].message?.content?.trim();
    if (!validationMessage) {
        return {
            isValid: false,
            isAligned: false,
            justification: "Failed to validate query.",
            isRateLimited: false,
        };
    }

    // Parse the validation message into its components
    const [isValid, isAligned, ...justificationParts] =
        validationMessage.split(" ");
    const justification = justificationParts.join(" ");

    return {
        isValid: isValid.toLowerCase() === "yes",
        isAligned: isAligned.toLowerCase() === "yes",
        justification,
        isRateLimited: false,
    };
};

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

        // Validate the query using the LLM
        const validationResult = await validateQuery(query);

        if (validationResult.isRateLimited) {
            // If the query is rate limited, send a 429 error response
            return sendClientSideError(
                req,
                res,
                validationResult.justification
            );
        }

        if (!validationResult.isValid) {
            // If the query is invalid, send a 400 error response
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        if (!validationResult.isAligned) {
            // If the query is not aligned with the database schema, send a 400 error response
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        // Send the query to the language model client to get the SQL translation
        const llmResponse = await llmClient.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI that translates natural language queries into SQL queries.  

                    Requirements:  
                    1. Ensure the SQL output is correctly structured and adheres to SQLite syntax.  
                    2. Return only the SQL query and an explanation of how the natural language query was converted.  
                    3. Format: The SQL query and explanation must be separated by a semicolon ('; ').  
                    4. SQL Query Formatting:  
                    - The query must be written as a single line with no special characters or extra formatting.  
                    - Ensure the query can be executed directly in a SQLite database without modification.  

                    Explanation Guidelines:  
                    - Clearly describe how each part of the SQL query maps to the natural language request.  
                    - If assumptions are made (e.g., handling ambiguous terms), explain them.  
                    - If filtering, grouping, or ordering is applied, describe why.  

                    Example Output Format:  
                    Input: 'Show me all products in the Electronics category ordered by price.'  
                    Output:  
                    'SELECT * FROM products WHERE category_id = (SELECT id FROM categories WHERE name = 'Electronics') ORDER BY price ASC; The query selects all columns from the 'products' table where the category matches 'Electronics'. A subquery is used to retrieve the category ID. The results are sorted in ascending order by price.'  

                    The Database is a SQLite database.  
                    ${databaseSchemaDescription}`,
                },
                {
                    role: "user",
                    content: `Convert this into SQL: "${query}"`,
                },
            ],
            // Sampling temperature for randomness
            temperature: 1.0,
            // Nucleus sampling parameter
            top_p: 1.0,
            // Maximum tokens in the generated response
            max_tokens: 1000,
            // Model name to use for the completion
            model: llmModelName,
        });

        // Extract the generated SQL query from the language model response
        const responseMessage = llmResponse.choices[0].message.content;

        if (!responseMessage) {
            // If the generated SQL query is empty, send a 500 error response
            return sendServerSideError(
                req,
                res,
                "Failed to generate SQL query"
            );
        }

        const [sqlQuery, explanation] = responseMessage.split("; ");

        // Prevent potentially harmful queries
        if (
            /DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE|UPDATE\s+SET/i.test(
                sqlQuery
            )
        ) {
            // If the query is potentially harmful, send a 400 error response
            return sendClientSideError(
                req,
                res,
                "Potentially destructive queries are not allowed."
            );
        }

        try {
            // Execute the generated SQL query on the database
            const rows = await db.all(sqlQuery);

            // Send a successful response with the SQL query and the result rows
            return sendSuccessResponse(
                req,
                res,
                "Query translated and executed successfully!",
                200,
                { sqlQuery, rows, explanation }
            );
        } catch (err) {
            // If there is an error executing the SQL query, send a 500 error response
            console.error("SQL Execution Error:", err);
            return sendServerSideError(req, res, "Failed to execute SQL query");
        }
    } catch (err) {
        // Pass any errors to the next middleware for handling
        next(err);
    }
};

/**
 * Handles requests to validate a query.
 * @param req The Request object.
 * @param res The Response object.
 * @param next The NextFunction.
 */
export const validateHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { query }: { query: string } = req.body;

        // Validate the query using the LLM
        const validationResult = await validateQuery(query);

        // If the query is rate limited, send a 429 error response
        if (validationResult.isRateLimited) {
            return sendClientSideError(
                req,
                res,
                validationResult.justification
            );
        }

        // If the query is invalid, send a 400 error response
        if (!validationResult.isValid) {
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        // If the query is not aligned with the database schema, send a 400 error response
        if (!validationResult.isAligned) {
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        // If the query is valid, send a 200 success response
        return sendSuccessResponse(
            req,
            res,
            "Validation of query successful!",
            200,
            {
                justification: validationResult.justification,
            }
        );
    } catch (err) {
        // Pass any errors to the next middleware for handling
        next(err);
    }
};
