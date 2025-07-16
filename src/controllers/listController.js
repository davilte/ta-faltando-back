import { sql } from '../config/db.js'

// GET /lists/completed
export async function getCompletedLists(req, res) {
  try {
    const lists = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = true
      ORDER BY date DESC;
    `
    res.json(lists)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch completed lists' })
  }
}

// GET /lists/current
export async function getCurrentList(req, res) {
  try {
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false
      LIMIT 1;
    `

    if (!list) return res.status(404).json({ error: 'No active list found' })

    const items = await sql`
        SELECT 
            sli.id,
            sli.checked,
            sli.quantity,
            p.id AS product_id,
            p.name,
            p.image,
            c.name AS category
        FROM shopping_list_items sli
        JOIN products p ON sli.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE sli.list_id = ${list.id}
        ORDER BY p.name;
    `

    res.json({ ...list, items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch current list' })
  }
}

// PATCH /lists/current/:productId
export async function patchCheckProduct(req, res) {
  const productId = Number(req.params.productId)

  try {
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false
      LIMIT 1;
    `
    if (!list) return res.status(404).json({ error: 'No active list found' })

    const [item] = await sql`
      SELECT * FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId};
    `
    if (!item) return res.status(404).json({ error: 'Product not found in current list' })

    const updated = await sql`
      UPDATE shopping_list_items
      SET checked = NOT checked
      WHERE id = ${item.id}
      RETURNING *;
    `
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update product check status' })
  }
}

// PATCH /lists/current/:productId/quantity
export async function updateProductQuantity(req, res) {
  const productId = Number(req.params.productId)
  const { quantity } = req.body

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' })
  }

  try {
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false
      LIMIT 1;
    `
    if (!list) return res.status(404).json({ error: 'No active list found' })

    const [item] = await sql`
      SELECT * FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId};
    `
    if (!item) return res.status(404).json({ error: 'Product not in current list' })

    const updated = await sql`
      UPDATE shopping_list_items
      SET quantity = ${quantity}
      WHERE id = ${item.id}
      RETURNING *;
    `
    res.json(updated[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update quantity' })
  }
}

// POST /lists/current/:productId
export async function postProductToCurrentList(req, res) {
  const productId = Number(req.params.productId)
  const { quantity = 1 } = req.body

  if (isNaN(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' })
  }

  try {
    let [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false
      LIMIT 1;
    `

    if (!list) {
      const today = new Date().toISOString().split('T')[0]
      const inserted = await sql`
        INSERT INTO shopping_lists (date, market, completed)
        VALUES (${today}, 'Default Market', false)
        RETURNING *;
      `
      list = inserted[0]
    }

    const [existing] = await sql`
      SELECT * FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId};
    `
    if (existing) {
      return res.status(400).json({ error: 'Product already in current list' })
    }

    const inserted = await sql`
      INSERT INTO shopping_list_items (list_id, product_id, quantity, checked)
      VALUES (${list.id}, ${productId}, ${quantity}, false)
      RETURNING *;
    `
    res.status(201).json(inserted[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add product to current list' })
  }
}
