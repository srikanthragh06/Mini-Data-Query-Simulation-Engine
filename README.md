# Mini-Data-Query-Simulation-Engine

## Overview
This project is designed for the Growth Gear Backend Engineering Intern Challenge, built in TypeScript using Express. It converts simple natural language queries into SQL queries, making it easier to retrieve data without knowing SQL.

The application utilizes OpenAI GPT-4 Mini as its Large Language Model (LLM) to generate SQL queries and explanations, ensuring accurate and efficient query conversion. Extensive error handling has been implemented to manage various edge cases, including:

- Handling invalid or ambiguous queries
- Preventing SQL injection risks
- Providing meaningful error messages for incorrect input formats

All operations are performed on a SQLite dummy sales database.

### Sales Database Schema

#### Categories Table

| Column  | Type    | Constraints |
|---------|--------|-------------|
| id      | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| name    | TEXT    | UNIQUE, NOT NULL |

#### Products Table
Contains details about available products.

| Column      | Type    | Constraints |
|------------|--------|-------------|
| id         | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| name       | TEXT    | UNIQUE, NOT NULL |
| category_id | INTEGER | FOREIGN KEY REFERENCES categories(id) |
| price      | REAL    | - |

#### Sales Table
Records sales transactions.

| Column        | Type    | Constraints |
|--------------|--------|-------------|
| id           | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| product_id   | INTEGER | FOREIGN KEY REFERENCES products(id) |
| revenue      | REAL    | - |
| quantity_sold | INTEGER | - |
| sale_date    | TEXT    | - | 

### Sales Database Values

#### Categories

| id | name        |
|----|------------|
| 1  | Electronics |
| 2  | Furniture   |
| 3  | Clothing    |
| 4  | Grocery     |

#### Products

| id | name       | category_id | price |
|----|-----------|-------------|-------|
| 1  | Laptop     | 1           | 1200  |
| 2  | Smartphone | 1           | 800   |
| 3  | Tablet     | 1           | 500   |
| 4  | Desk       | 2           | 300   |
| 5  | Chair      | 2           | 150   |
| 6  | Sofa       | 2           | 700   |
| 7  | T-Shirt    | 3           | 25    |
| 8  | Jeans      | 3           | 40    |
| 9  | Jacket     | 3           | 100   |
| 10 | Milk       | 4           | 5     |
| 11 | Bread      | 4           | 3     |

#### Sales

| id | product_id | revenue | quantity_sold | sale_date  |
|----|-----------|---------|---------------|------------|
| 1  | 1         | 1200    | 10            | 2024-03-15 |
| 2  | 2         | 800     | 15            | 2024-03-10 |
| 3  | 3         | 500     | 8             | 2024-02-20 |
| 4  | 4         | 300     | 5             | 2024-01-25 |
| 5  | 5         | 150     | 12            | 2024-02-10 |
| 6  | 6         | 700     | 3             | 2024-03-05 |
| 7  | 7         | 25      | 50            | 2024-03-18 |
| 8  | 8         | 40      | 30            | 2024-03-12 |
| 9  | 9         | 100     | 20            | 2024-02-15 |
| 10 | 10        | 5       | 100           | 2024-03-17 |
| 11 | 11        | 3       | 90            | 2024-03-16 |

---

## Deployment 

The backend server is deployed on https://mini-data-query-simulation-engine-wvei.onrender.com with the help of Render.

---


## Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- npm (Node Package Manager)

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/srikanthragh06/Mini-Data-Query-Simulation-Engine.git
   cd Mini-Data-Query-Simulation-Engine
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up the environment variables:**
   Create a `.env` file in the root directory with the following:
   ```env
   GITHUB_PAT=<your_github_personal_access_token>
   ```

4. **Create the dummy sqlite file**
   ```
   npm run createDB
   ```

5. **Start the server:**
   ```sh
   npm run build && npm start
   ```
---

## Sample Query Examples

### On /query

#### **Example: Valid Query**
##### **Request:**
```json
{
    "query": "Show total sales for each product."
}
```
##### **Response (200 OK):**
```json
{
    "message": "Query translated and executed successfully!",
    "sqlQuery": "SELECT products.name, SUM(sales.revenue) AS total_sales FROM products LEFT JOIN sales ON products.id = sales.product_id GROUP BY products.id",
    "rows": [
        { "name": "Laptop", "total_sales": 1200 },
        { "name": "Smartphone", "total_sales": 800 },
        { "name": "Tablet", "total_sales": 500 },
        { "name": "Desk", "total_sales": 300 },
        { "name": "Chair", "total_sales": 150 },
        { "name": "Sofa", "total_sales": 700 },
        { "name": "T-Shirt", "total_sales": 25 },
        { "name": "Jeans", "total_sales": 40 },
        { "name": "Jacket", "total_sales": 100 },
        { "name": "Milk", "total_sales": 5 },
        { "name": "Bread", "total_sales": 3 }
    ],
    "explanation": "The query retrieves the product names and their total sales revenue by joining the 'products' table with the 'sales' table on the product ID. A LEFT JOIN is used to ensure all products are included, even if they have no sales, and the results are grouped by product ID to calculate the sum of revenue for each product."
}
```

---

#### **Example: Missing Query**
##### **Request:**
```json
{}
```
##### **Response (400 Bad Request):**
```json
{
    "error": "Query is required"
}
```

---

#### **Example: Invalid Query (Opinion-Based Question)**
##### **Request:**
```json
{
    "query": "Is it cold outside?"
}
```
##### **Response (400 Bad Request):**
```json
{
    "error": "Invalid query: The query is not a valid request for retrieving data from the database; it is an opinion-based question."
}
```

---

#### **Example: Invalid Query (Destructive Query Attempt - SQL Injection)**
##### **Request:**
```json
{
    "query": "DROP TABLE sales;"
}
```
##### **Response (400 Bad Request):**
```json
{
    "error": "Invalid query: The query is not a valid data retrieval request as it is a command to delete a table."
}
```

---

#### **Example: Overly Complex Query**
##### **Request:**
```json
{
    "query": "Show me the sales data for every product since the beginning of time, grouped by month, with an average revenue calculation, ordered by highest sales, and also include a detailed breakdown per product category, and a comparison with last year's data..."
}
```
##### **Response (400 Bad Request):**
```json
{
    "error": "Invalid query: The query is too complex and includes multiple requests that are not straight data retrieval, such as comparisons and detailed breakdowns. It also attempts to group and calculate averages without a clear structure aligned with SQL syntax. A valid query may be simplified to something like, 'Show me the sales data for every product, including average revenue per month.'"
}
```



## API Documentation

This API provides endpoints to translate natural language queries into SQL, validate queries against a database schema, and generate explanations for how queries are converted.

### Base URL

All endpoints are relative to the base URL of your API.

### Endpoints

#### 1. Execute Query

Validates, translates, and executes a natural language query.

**Endpoint:** `POST /query`

**Request Body:**
```json
{
  "query": "string"  // Natural language query to translate and execute
}
```

**Success Response (200):**
```json
{
  "message": "Query translated and executed successfully!",
  "sqlQuery": "SELECT * FROM products WHERE category_id = (SELECT id FROM categories WHERE name = 'Clothing') ORDER BY price ASC LIMIT 1",
  "rows": [
    {
      "id": 7,
      "name": "T-Shirt",
      "category_id": 3,
      "price": 25
    }
  ],
  "explanation": "The query selects all columns from the 'products' table where the category matches 'Clothing'. A subquery retrieves the category ID for 'Clothing', and the results are ordered by price in ascending order, with a limit of 1 to get the product with the lowest price."
}
```

**Error Responses:**

* 400 Bad Request - Invalid query:
```json
{
  "error": "string"
}
```

* 500 Server Error:
```json
{
  "error": "string"
}
```

#### 2. Validate Query

Validates a natural language query without executing it.

**Endpoint:** `POST /validate`

**Request Body:**
```json
{
  "query": "string"  // Natural language query to validate
}
```

**Success Response (200):**
```json
{
  "message": "Validation of query successful!",
  "justification": "The query is a meaningful request for data as it seeks to retrieve specific information about a product based on its price within a certain category. Additionally, it aligns with the schema as it involves the \"products\" table (which contains product-related data) and implies a relation to the \"categories\" table for filtering by category."
}
```

**Error Responses:**

* 400 Bad Request:
```json
{
  "error": "string"
}
```

* 500 Server Error:
```json
{
  "error": "string"
}
```

#### 3. Explain Query

Validates a query and returns the generated SQL with an explanation, without executing it.

**Endpoint:** `POST /explain`

**Request Body:**
```json
{
  "query": "string"  // Natural language query to explain
}
```

**Success Response (200):**
```json
{
  "message": "Explanation generated successfully!",
  "sqlQuery": "SELECT * FROM products WHERE category_id = (SELECT id FROM categories WHERE name = 'Clothing') ORDER BY price ASC LIMIT 1",
  "explanation": "The query selects all columns from the 'products' table where the category matches 'Clothing'. A subquery retrieves the category ID for 'Clothing', and the results are ordered by price in ascending order to find the lowest price product. The LIMIT 1 clause ensures only the product with the lowest price is returned."
}
```

**Error Responses:**

* 400 Bad Request:
```json
{
  "error": "string"
}
```

* 500 Server Error:
```json
{
  "error": "string"
}
```

### Validation Process

All endpoints validate queries through the following checks:
- **Meaningful Data Request**: Ensures the query is a valid natural language request for retrieving data.
- **Schema Alignment**: Ensures the query aligns with the database schema.

### Security Measures

The API implements security measures to prevent potentially destructive operations:
- Blocks queries containing `DROP TABLE`, `DELETE FROM`, `ALTER TABLE`, or `UPDATE SET`

### Error Handling

The API returns appropriate HTTP status codes and error messages:
- 400 for client errors (invalid queries, format issues)
- 500 for server errors (LLM issues, database failures)
