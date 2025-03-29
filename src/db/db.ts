import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export let db: Database<sqlite3.Database, sqlite3.Statement>;

/**
 * Opens a connection to the SQLite database.
 * @async
 * @function
 * @returns {Promise<void>} Resolves when the database connection is successfully opened.
 */
export const openDB = async (): Promise<void> => {
    db = await open({
        filename: "sales.db",
        driver: sqlite3.Database,
    });
};

/**
 * Closes the connection to the SQLite database.
 *
 * @async
 * @function
 * @returns {Promise<void>} Resolves when the database connection is successfully closed.
 */
export const closeDB = async (): Promise<void> => {
    await db.close();
};

/**
 * A prompt describing the schema of the SQLite database.
 *
 * The database consists of three tables:
 * - `categories`: Stores category information.
 * - `products`: Stores product information and associates products with categories.
 * - `sales`: Stores sales transactions, including product details and revenue.
 *
 * @type {string}
 */
export const databaseSchemaPrompt: string = `
The SQLite database consists of three tables: categories, products, and sales.

1. categories:
   - id (INTEGER, PRIMARY KEY, AUTOINCREMENT) → Unique identifier for each category.
   - name (TEXT, UNIQUE, NOT NULL) → Name of the category (e.g., Electronics, Furniture).

2. products:
   - id (INTEGER, PRIMARY KEY, AUTOINCREMENT) → Unique identifier for each product.
   - name (TEXT, UNIQUE, NOT NULL) → Name of the product (e.g., Laptop, Chair).
   - category_id (INTEGER, FOREIGN KEY) → References categories(id), associating each product with a category.
   - price (REAL) → Price of the product.

3. sales:
   - id (INTEGER, PRIMARY KEY, AUTOINCREMENT) → Unique identifier for each sale transaction.
   - product_id (INTEGER, FOREIGN KEY) → References products(id), indicating which product was sold.
   - revenue (REAL) → Revenue generated from the sale.
   - quantity_sold (INTEGER) → Number of units sold.
   - sale_date (TEXT) → Date of the sale (YYYY-MM-DD format).
`;
