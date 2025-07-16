import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// Creates sql connection using the DB URL from the environment variables
export const sql = neon(process.env.DATABASE_URL)

export async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT,
        category_id INT REFERENCES categories(id)
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        market TEXT,
        completed BOOLEAN DEFAULT FALSE
      );
    `

    await sql`
        CREATE TABLE IF NOT EXISTS shopping_list_items (
            id SERIAL PRIMARY KEY,
            list_id INT REFERENCES shopping_lists(id) ON DELETE CASCADE,
            product_id INT REFERENCES products(id),
            quantity INT DEFAULT 1,
            checked BOOLEAN DEFAULT FALSE
        );
    `

    console.log('✅ Tables created or already exist')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    process.exit(1)
  }
}
