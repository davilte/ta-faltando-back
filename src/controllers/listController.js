import { sql } from '../config/db.js'

export async function getCurrentListData(userId) {
  const [list] = await sql`
    SELECT * FROM shopping_lists
    WHERE completed = false AND user_id = ${userId}
    LIMIT 1;
  `
  // if (!list) return res.status(404).json({ error: 'No active list found' })
  if (!list) return null

  const items = await sql`
    SELECT 
      sli.checked,
      sli.quantity,
      p.id AS id,
      p.name,
      c.name AS category
    FROM shopping_list_items sli
    JOIN products p ON sli.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE sli.list_id = ${list.id}
    ORDER BY p.name;
  `

  return { ...list, items }
}

// GET /lists/completed
export async function getCompletedLists(req, res) {
  try {
    const userId = req.userId

    // Busca todas as listas concluídas do usuário
    const lists = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = true AND user_id = ${userId}
      ORDER BY date DESC;
    `

    // Para cada lista, buscar os itens
    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await sql`
          SELECT 
            sli.checked,
            sli.quantity,
            p.id AS id,
            p.name,
            c.name AS category
          FROM shopping_list_items sli
          JOIN products p ON sli.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          WHERE sli.list_id = ${list.id}
          ORDER BY p.name;
        `

        return {
          ...list,
          items,
        }
      })
    )

    res.json(listsWithItems)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch completed lists' })
  }
}


// GET /lists/current
export async function getCurrentList(req, res) {
  const userId = req.userId
  try {
    let list = await getCurrentListData(userId)

    // If not found, create a new one
    if (!list) {
      const today = new Date().toISOString().split('T')[0]
      const inserted = await sql`
        INSERT INTO shopping_lists (date, market, completed, user_id)
        VALUES (${today}, 'Default Market', false, ${userId})
        RETURNING *;
      `
      list = inserted[0]
    }
    
    res.json(list)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch current list' })
  }
}

// PATCH /lists/current/:productId
export async function patchCheckProduct(req, res) {
  const productId = Number(req.params.productId)
  const userId = req.userId

  try {
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false AND user_id = ${userId}
      LIMIT 1;
    `
    if (!list) {
      return res.status(404).json({ error: 'No active list found' })
    }

    const [item] = await sql`
      SELECT * FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId};
    `
    if (!item) {
      return res.status(404).json({ error: 'Product not found in current list' })
    }

    await sql`
      UPDATE shopping_list_items
      SET checked = NOT checked
      WHERE id = ${item.id};
    `

    const fullList = await getCurrentListData(userId)
    res.json(fullList)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update product check status' })
  }
}

// PATCH /lists/current/:productId/quantity
export async function updateProductQuantity(req, res) {
  const productId = Number(req.params.productId)
  const { quantity } = req.body
  const userId = req.userId

  // Validate input: quantity must be a non-negative integer
  if (!Number.isInteger(quantity) || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative integer' })
  }

  try {
    // Fetch the current active (not completed) shopping list
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false AND user_id = ${userId}
      LIMIT 1;
    `
    if (!list) {
      return res.status(404).json({ error: 'No active list found' })
    }

    // Check if the product is already in the current list
    const [item] = await sql`
      SELECT * FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId};
    `
    if (!item) {
      return res.status(404).json({ error: 'Product not in current list' })
    }

    // If quantity is 0, remove the product from the list
    if (quantity === 0) {
      await sql`
        DELETE FROM shopping_list_items
        WHERE id = ${item.id};
      `
    } else {
      // Otherwise, update the quantity
      await sql`
        UPDATE shopping_list_items
        SET quantity = ${quantity}
        WHERE id = ${item.id};
      `
    }

    // Return the entire updated current list to sync frontend
    const fullList = await getCurrentListData(userId)
    res.json(fullList)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update quantity' })
  }
}

// POST /lists/current/:productId
export async function postProductToCurrentList(req, res) {
  const productId = Number(req.params.productId)
  const { quantity = 1 } = req.body
  const userId = req.userId

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' })
  }

  try {
    // Verifica se já existe lista atual
    let [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false AND user_id = ${userId}
      LIMIT 1;
    `

    // Cria nova lista se não houver
    if (!list) {
      const today = new Date().toISOString().split('T')[0]
      const inserted = await sql`
        INSERT INTO shopping_lists (date, market, completed, user_id)
        VALUES (${today}, 'Default Market', false, ${userId})
        RETURNING *;
      `
      list = inserted[0]
    }

    // Verifica se o produto já está na lista
    const [existing] = await sql`
      SELECT * FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId};
    `
    if (existing) {
      return res.status(400).json({ error: 'Product already in current list' })
    }

    // Insere produto
    await sql`
      INSERT INTO shopping_list_items (list_id, product_id, quantity, checked)
      VALUES (${list.id}, ${productId}, ${quantity}, false);
    `

    // Retorna lista atualizada
    const fullList = await getCurrentListData(userId)
    res.status(201).json(fullList)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add product to current list' })
  }
}

// DELETE /lists/current/:productId
export async function deleteProductFromCurrentList(req, res) {
  const productId = Number(req.params.productId)
  const userId = req.userId

  try {
    // Busca a lista atual (não concluída)
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false AND user_id = ${userId}
      LIMIT 1;
    `
    if (!list) {
      return res.status(404).json({ error: 'No active list found' })
    }

    // Remove o produto da lista, se existir
    const deleted = await sql`
      DELETE FROM shopping_list_items
      WHERE list_id = ${list.id} AND product_id = ${productId}
      RETURNING *;
    `
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Product not found in current list' })
    }

    // Retorna a lista atualizada completa
    const fullList = await getCurrentListData(userId)
    res.json(fullList)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete product' })
  }
}

// PATCH /lists/current/complete
export async function completeCurrentList(req, res) {
  const userId = Number(req.userId)
  if (!Number.isInteger(userId)) {
    return res.status(401).json({ error: 'Invalid or missing token' })
  }
  try {
    // 🔍 Busca a lista ativa do usuário
    const [list] = await sql`
      SELECT * FROM shopping_lists
      WHERE completed = false AND user_id = ${userId}
      LIMIT 1;
    `
    if (!list) {
      return res.status(404).json({ error: 'No active list to complete' })
    }

    // ✅ Marca como concluída
    await sql`
      UPDATE shopping_lists
      SET completed = true
      WHERE id = ${list.id};
    `

    res.json({ message: 'List marked as completed', listId: list.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to complete the list' })
  }
}