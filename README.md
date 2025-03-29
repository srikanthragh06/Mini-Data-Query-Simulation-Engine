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

## API Documentation

