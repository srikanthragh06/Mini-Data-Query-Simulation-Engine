import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from a .env file
dotenv.config();

// Define the endpoint URL for the OpenAI service
const endpoint = "https://models.inference.ai.azure.com";

// Retrieve the GitHub Personal Access Token from environment variables
const GITHUB_PAT = process.env.GITHUB_PAT;

if (GITHUB_PAT === undefined) {
    throw new Error("Github Personal Access Token isn't defined");
}

/**
 * Initialize an OpenAI client with the specified endpoint and API key.
 * This client will be used to interact with the OpenAI service.
 */
export const llmClient = new OpenAI({ baseURL: endpoint, apiKey: GITHUB_PAT });

// Define the model name to use for language model operations
export const llmModelName = "gpt-4o-mini";
