import express from 'express'
import {
  getCompletedLists,
  getCurrentList,
  patchCheckProduct,
  updateProductQuantity,
  postProductToCurrentList,
  deleteProductFromCurrentList,
  completeCurrentList,
  updateListName
} from '../controllers/listController.js'
import { getProducts } from '../controllers/productController.js'
import { register, login } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'
const router = express.Router()


router.post('/register', register)
router.post('/login', login)

router.get('/lists/completed', authenticateToken, getCompletedLists)
router.get('/lists/current', authenticateToken, getCurrentList)
router.post('/lists/current/:productId', authenticateToken, postProductToCurrentList)
router.patch('/lists/current/:productId', authenticateToken, patchCheckProduct)
router.patch('/lists/current/:productId/quantity', authenticateToken, updateProductQuantity)
router.delete('/lists/current/:productId', authenticateToken, deleteProductFromCurrentList)
router.patch('/lists/complete', authenticateToken, completeCurrentList)
router.patch('/lists/:listId/name', authenticateToken, updateListName)

router.get('/products', getProducts)

export default router
