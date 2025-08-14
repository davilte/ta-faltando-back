import express from 'express'
import {
  getCompletedLists,
  getCurrentList,
  patchCheckProduct,
  updateProductQuantity,
  postProductToCurrentList,
  deleteProductFromCurrentList,
  completeCurrentList,
  updateCurrentListName
} from '../controllers/listController.js'
import { getProducts } from '../controllers/productController.js'
import { register, login } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Auth
router.post('/register', register)
router.post('/login', login)

// ----- List-wide endpoints -----
router.patch('/lists/current/name', authenticateToken, updateCurrentListName)
router.patch('/lists/complete', authenticateToken, completeCurrentList)

router.get('/lists/current', authenticateToken, getCurrentList)
router.get('/lists/completed', authenticateToken, getCompletedLists)

// ----- Item endpoints -----
router.post('/lists/current/:productId(\\d+)', authenticateToken, postProductToCurrentList)
router.patch('/lists/current/:productId(\\d+)', authenticateToken, patchCheckProduct)
router.patch('/lists/current/:productId(\\d+)/quantity', authenticateToken, updateProductQuantity)
router.delete('/lists/current/:productId(\\d+)', authenticateToken, deleteProductFromCurrentList)

// Public products (or proteja se preferir)
router.get('/products', getProducts)

export default router
