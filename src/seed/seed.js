import { sql } from '../config/db.js'
import { categories } from './categories.js'
import { products } from './products.js'

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...')

    // Inserir categorias
    for (const name of categories) {
      await sql`
        INSERT INTO categories (name)
        VALUES (${name})
        ON CONFLICT (name) DO NOTHING;
      `
    }

    // Inserir produtos, relacionando com category_id
    for (const { name, category } of products) {
      const [categoryRow] = await sql`
        SELECT id FROM categories
        WHERE name = ${category};
      `
      if (!categoryRow) {
        console.warn(`⚠️ Categoria "${category}" não encontrada para o produto "${name}". Ignorado.`)
        continue
      }

      await sql`
        INSERT INTO products (name, category_id)
        VALUES (${name}, ${categoryRow.id})
        ON CONFLICT (name) DO NOTHING;
      `
    }

    console.log('✅ Seed concluído com sucesso!')
    process.exit(0)

  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error)
    process.exit(1)
  }
}

seedDatabase()
