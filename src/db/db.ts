import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("sales.db");

/**
 * Initializes the SQLite database by creating the required tables and
 * inserting some initial data.
 */
export const initializeDatabase = () => {
    db.serialize(() => {
        createTables();
        insertInitialData();
    });

    console.log("SQLite database setup complete!");
};

/**
 * Creates the required tables in the SQLite database.
 */
const createTables = () => {
    db.run(
        /**
         * Creates the categories table.
         * The categories table has the following columns:
         * - id: The primary key of the table which auto-increments.
         * - name: The name of the category.
         */
        `CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )`
    );

    db.run(
        /**
         * Creates the products table.
         * The products table has the following columns:
         * - id: The primary key of the table which auto-increments.
         * - name: The name of the product.
         * - category_id: The foreign key referencing the categories table.
         * - price: The price of the product.
         */
        `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            category_id INTEGER,
            price REAL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )`
    );

    db.run(
        /**
         * Creates the sales table.
         * The sales table has the following columns:
         * - id: The primary key of the table which auto-increments.
         * - product_id: The foreign key referencing the products table.
         * - revenue: The revenue from the sale.
         * - quantity_sold: The quantity of the product sold.
         * - sale_date: The date when the sale occurred.
         */
        `CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            revenue REAL,
            quantity_sold INTEGER,
            sale_date TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`
    );
};

/**
 * Inserts initial data into the database.
 * This includes categories, products, and sales data.
 */
const insertInitialData = () => {
    /**
     * Insert categories into the database.
     * The categories are: Electronics, Furniture, Clothing, Grocery.
     */
    const categories = ["Electronics", "Furniture", "Clothing", "Grocery"];
    const insertCategory = db.prepare(
        "INSERT INTO categories (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)"
    );
    categories.forEach((category) => insertCategory.run(category, category));
    insertCategory.finalize();

    /**
     * Insert products into the database.
     * The products are:
     * - Laptop: Electronics, $1200
     * - Smartphone: Electronics, $800
     * - Tablet: Electronics, $500
     * - Desk: Furniture, $300
     * - Chair: Furniture, $150
     * - Sofa: Furniture, $700
     * - T-Shirt: Clothing, $25
     * - Jeans: Clothing, $40
     * - Jacket: Clothing, $100
     * - Milk: Grocery, $5
     * - Bread: Grocery, $3
     */
    const products = [
        ["Laptop", 1, 1200],
        ["Smartphone", 1, 800],
        ["Tablet", 1, 500],
        ["Desk", 2, 300],
        ["Chair", 2, 150],
        ["Sofa", 2, 700],
        ["T-Shirt", 3, 25],
        ["Jeans", 3, 40],
        ["Jacket", 3, 100],
        ["Milk", 4, 5],
        ["Bread", 4, 3],
    ];

    const insertProduct = db.prepare(
        `INSERT INTO products (name, category_id, price) 
         SELECT ?, ?, ? 
         WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = ?)`
    );
    products.forEach(([name, categoryId, price]) =>
        insertProduct.run(name, categoryId, price, name)
    );
    insertProduct.finalize();

    /**
     * Insert sales into the database.
     * The sales are:
     * - Laptop: 10, 2024-03-15
     * - Smartphone: 15, 2024-03-10
     * - Tablet: 8, 2024-02-20
     * - Desk: 5, 2024-01-25
     * - Chair: 12, 2024-02-10
     * - Sofa: 3, 2024-03-05
     * - T-Shirt: 50, 2024-03-18
     * - Jeans: 30, 2024-03-12
     * - Jacket: 20, 2024-02-15
     * - Milk: 100, 2024-03-17
     * - Bread: 90, 2024-03-16
     */
    const sales = [
        [1, 1200, 10, "2024-03-15"],
        [2, 800, 15, "2024-03-10"],
        [3, 500, 8, "2024-02-20"],
        [4, 300, 5, "2024-01-25"],
        [5, 150, 12, "2024-02-10"],
        [6, 700, 3, "2024-03-05"],
        [7, 25, 50, "2024-03-18"],
        [8, 40, 30, "2024-03-12"],
        [9, 100, 20, "2024-02-15"],
        [10, 5, 100, "2024-03-17"],
        [11, 3, 90, "2024-03-16"],
    ];

    const insertSale = db.prepare(
        `INSERT INTO sales (product_id, revenue, quantity_sold, sale_date) 
         SELECT ?, ?, ?, ? 
         WHERE NOT EXISTS (SELECT 1 FROM sales WHERE product_id = ? AND sale_date = ?)`
    );
    sales.forEach(([productId, revenue, quantity, date]) =>
        insertSale.run(productId, revenue, quantity, date, productId, date)
    );
    insertSale.finalize();
};

export const databaseSchemaDescription = `
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

The database is initialized with sample data:
- Categories include 'Electronics', 'Furniture', 'Clothing', and 'Grocery'.
- Products belong to these categories, such as 'Laptop' ($1200, Electronics) and 'Chair' ($150, Furniture).
- Sales records track product sales, including quantity sold, revenue, and sale date.

The database ensures uniqueness for categories and products. Foreign key constraints maintain data integrity between tables.
`;
