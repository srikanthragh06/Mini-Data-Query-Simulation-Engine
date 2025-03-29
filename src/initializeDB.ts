import { closeDB, db, openDB } from "./db/db";

/**
 * Initializes the SQLite database by creating the required tables and inserting initial data.
 */
export const createDB = async () => {
    await openDB();

    await createTables();
    await insertInitialData();

    console.log("SQLite database setup complete!");

    await closeDB();
};

/**
 * Creates the required tables in the SQLite database.
 */
const createTables = async () => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            category_id INTEGER,
            price REAL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            revenue REAL,
            quantity_sold INTEGER,
            sale_date TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    `);
};

/**
 * Inserts initial data into the database.
 */
const insertInitialData = async () => {
    const categories = ["Electronics", "Furniture", "Clothing", "Grocery"];
    for (const category of categories) {
        await db.run(
            `INSERT INTO categories (name) 
             SELECT ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)`,
            category,
            category
        );
    }

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
    for (const [name, categoryId, price] of products) {
        await db.run(
            `INSERT INTO products (name, category_id, price) 
             SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = ?)`,
            name,
            categoryId,
            price,
            name
        );
    }

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
    for (const [productId, revenue, quantity, date] of sales) {
        await db.run(
            `INSERT INTO sales (product_id, revenue, quantity_sold, sale_date) 
             SELECT ?, ?, ?, ? WHERE NOT EXISTS 
             (SELECT 1 FROM sales WHERE product_id = ? AND sale_date = ?)`,
            productId,
            revenue,
            quantity,
            date,
            productId,
            date
        );
    }
};

createDB();
