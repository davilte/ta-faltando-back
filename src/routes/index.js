import express from 'express'
import {
  getCompletedLists,
  getCurrentList,
  patchCheckProduct,
  updateProductQuantity,
  postProductToCurrentList,
} from '../controllers/listController.js'
import { getProducts } from '../controllers/productController.js'

const router = express.Router()

router.get('/lists/completed', getCompletedLists)
router.get('/lists/current', getCurrentList)
router.patch('/lists/current/:productId', patchCheckProduct)
router.patch('/lists/current/:productId/quantity', updateProductQuantity)
router.post('/lists/current/:productId', postProductToCurrentList)

router.get('/products', getProducts)

export default router
