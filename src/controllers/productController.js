import { sql } from '../config/db.js'

// GET /products
export async function getProducts(req, res) {
  try {
    const products = await sql`
      SELECT products.id, products.name, products.image, category_id, categories.name AS category
      FROM products
      JOIN categories ON products.category_id = categories.id
      ORDER BY products.name;
    `
    res.json(products)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}
