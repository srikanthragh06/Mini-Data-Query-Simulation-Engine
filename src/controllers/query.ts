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
 * Validates a natural language query before conversion to SQL.
 *
 * This function sends the query to an AI model that checks:
 * 1. If the query is a meaningful data retrieval request.
 * 2. If the query aligns with the database schema.
 *
 * @param query - The natural language query to validate.
 * @returns A promise resolving to an object containing:
 *  - `isValid`: Whether the query is a meaningful data request.
 *  - `isAligned`: Whether the query matches the database schema.
 *  - `justification`: Explanation for the validation result.
 */
const validateQuery = async (
    query: string
): Promise<{
    isValid: boolean;
    isAligned: boolean;
    justification: string;
}> => {
    let llmResponse: ChatCompletion & { _request_id?: string | null };

    try {
        // Sending the query to the AI model for validation
        llmResponse = await llmClient.chat.completions.create({
            messages: [
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
                    
                    The Database is a SQLite database.
                    ${databaseSchemaDescription}
                    
                    Additional Considerations:
                    - Normalize minor grammatical errors before validation.
                    - Suggest corrections for slightly incorrect but understandable queries.
                    - Provide clear examples of valid and invalid queries.
                    `,
                },
                {
                    role: "user",
                    content: `Validate this query: "${query}"`,
                },
            ],
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 1000,
            model: llmModelName,
        });
    } catch (err) {
        throw new Error("Failed to validate query");
    }

    // Handling cases where no response is received
    if (!llmResponse.choices || llmResponse.choices.length === 0) {
        return {
            isValid: false,
            isAligned: false,
            justification: "Failed to validate query.",
        };
    }

    const validationMessage = llmResponse.choices[0].message?.content?.trim();
    if (!validationMessage) {
        return {
            isValid: false,
            isAligned: false,
            justification: "Failed to validate query.",
        };
    }

    // Parsing the response format: "yes/no yes/no justification"
    const [isValid, isAligned, ...justificationParts] =
        validationMessage.split(" ");
    const justification = justificationParts.join(" ");

    return {
        isValid: isValid.toLowerCase() === "yes",
        isAligned: isAligned.toLowerCase() === "yes",
        justification,
    };
};

/**
 * Handles a natural language query request, validating and converting it into SQL.
 *
 * Steps:
 * 1. **Validate Query:** Ensures the query is meaningful and aligns with the database schema.
 * 2. **Convert to SQL:** Uses LLM to generate an SQL query along with an explanation.
 * 3. **Execute SQL Query:** Runs the generated query against the SQLite database.
 * 4. **Return Response:** Sends the generated SQL, explanation, and query results to the client.
 *
 * @param req - Express request object, expects `{ query: string }` in the request body.
 * @param res - Express response object used to send responses back to the client.
 * @param next - Express next function for error handling.
 */
export const queryHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { query }: { query: string } = req.body;

        // Step 1: Validate the query
        const validationResult = await validateQuery(query);

        if (!validationResult.isValid) {
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        if (!validationResult.isAligned) {
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        // Step 2: Convert natural language query into SQL using the LLM
        const llmResponse = await llmClient.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI that translates natural language queries into SQL queries.  

                    **Requirements:**  
                    1. Ensure the SQL output is correctly structured and adheres to SQLite syntax.  
                    2. Return only the SQL query and an explanation of how the natural language query was converted.  
                    3. **Format:** The SQL query and explanation must be separated by a semicolon (';').  
                    4. **SQL Query Formatting:**  
                       - The query must be written as a single line with no special characters or extra formatting.  
                       - Ensure the query can be executed directly in a SQLite database without modification.  

                    **Explanation Guidelines:**  
                    - Clearly describe how each part of the SQL query maps to the natural language request.  
                    - If assumptions are made (e.g., handling ambiguous terms), explain them.  
                    - If filtering, grouping, or ordering is applied, describe why.  

                    **Example Output Format:**  
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
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 1000,
            model: llmModelName,
        });

        const responseMessage = llmResponse.choices[0].message.content;

        // Step 3: Ensure response is received
        if (!responseMessage) {
            return sendServerSideError(
                req,
                res,
                "Failed to generate SQL query"
            );
        }

        // Extract SQL query and explanation
        const [sqlQuery, explanation] = responseMessage.split("; ");

        // Step 4: Prevent potentially destructive SQL queries
        if (
            /DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE|UPDATE\s+SET/i.test(
                sqlQuery
            )
        ) {
            return sendClientSideError(
                req,
                res,
                "Potentially destructive queries are not allowed."
            );
        }

        // Step 5: Execute the SQL query
        try {
            const rows = await db.all(sqlQuery);
            if (!rows) {
                return sendServerSideError(
                    req,
                    res,
                    "Failed to execute SQL query"
                );
            }

            return sendSuccessResponse(
                req,
                res,
                "Query translated and executed successfully!",
                200,
                { sqlQuery, rows, explanation }
            );
        } catch (err) {
            console.error("SQL Execution Error:", err);
            return sendServerSideError(req, res, "Failed to execute SQL query");
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Handles query validation requests.
 *
 * Steps:
 * 1. **Extract Query:** Retrieves the `query` string from the request body.
 * 2. **Validate Query:** Ensures the query is valid and aligned with the database schema.
 * 3. **Return Validation Result:** Responds with validation success or an error message.
 *
 * @param req - Express request object, expects `{ query: string }` in the request body.
 * @param res - Express response object used to send validation results.
 * @param next - Express next function for error handling.
 */
export const validateHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { query }: { query: string } = req.body;

        // Step 1: Validate the query
        const validationResult = await validateQuery(query);

        // Step 2: Check if the query is valid
        if (!validationResult.isValid || !validationResult.isAligned) {
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        // Step 3: Return validation success response
        return sendSuccessResponse(
            req,
            res,
            "Validation of query successful!",
            200,
            { justification: validationResult.justification }
        );
    } catch (err) {
        next(err);
    }
};

/**
 * Handles natural language query explanation requests.
 *
 * Steps:
 * 1. **Extract Query:** Retrieves the `query` string from the request body.
 * 2. **Validate Query:** Ensures the query is valid and aligns with the database schema.
 * 3. **Generate SQL Query & Explanation:** Uses an AI model to convert the query into SQL and explain the transformation.
 * 4. **Return the SQL Query & Explanation:** Sends the response back to the client.
 *
 * @param req - Express request object, expects `{ query: string }` in the request body.
 * @param res - Express response object used to return the explanation.
 * @param next - Express next function for error handling.
 */
export const explainHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { query }: { query: string } = req.body;

        // Step 1: Validate the query
        const validationResult = await validateQuery(query);

        // Step 2: Check if the query is valid
        if (!validationResult.isValid || !validationResult.isAligned) {
            return sendClientSideError(
                req,
                res,
                `Invalid query: ${validationResult.justification}`
            );
        }

        // Step 3: Request AI to convert natural language query into SQL with explanation
        const llmResponse = await llmClient.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI that translates natural language queries into SQL queries.  

                    Requirements:  
                    1. Ensure the SQL output is correctly structured and adheres to SQLite syntax.  
                    2. Return only the SQL query and an explanation of how the natural language query was converted.  
                    3. Format: The SQL query and explanation must be separated by a semicolon (';').  
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
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 1000,
            model: llmModelName,
        });

        // Step 4: Extract response content
        const responseMessage = llmResponse.choices[0].message.content;

        if (!responseMessage) {
            return sendServerSideError(
                req,
                res,
                "Failed to generate simulated query explanation"
            );
        }

        // Split response into SQL query and explanation
        const [sqlQuery, explanation] = responseMessage.split("; ");

        // Step 5: Return the response
        return sendSuccessResponse(
            req,
            res,
            "Explanation generated successfully!",
            200,
            { sqlQuery, explanation }
        );
    } catch (err) {
        next(err);
    }
};
