import logger from '../../utils/logger'
import express from 'express'

import isLoggedInPolicie from '../policies/isLoggedIn.js'
import isUserAuthenticatedPolicy from '../policies/isUserAuthenticated.js'
import ProductController from '../controllers/admin/product'
import AuthController from '../controllers/auth'
import UserController from'../controllers/user/userRegistration';
import OrderController from '../controllers/admin/order';

const router = express.Router()
import decodeReqPolicy from '../policies/decodeRequest.js'
import encodeResPolicy from '../policies/encodeResponse.js'
router.get('/encode', (req, res) => {
  res.render('encode')
})

router.post('/encode', (req, res) => {
  const body = req.body

  logger.info('ENCODE BREQ BODY :->', body);

  res.send({
    'encoded': enc
  })
})

router.get('/decode', (req, res) => {
  res.render('decode')
})

router.post('/decode', (req, res) => {
  const body = req.body

  logger.info('DECODE REQ BODY :->', body)
  res.send(dec)
})

router.all('/*', (req, res, next) => {
  res.sendToEncode = (data) => {
    req.resbody = data
    next()
  }
  next()
}, decodeReqPolicy)


router.post('/auth/user/login',AuthController.login)
router.all('/api/*', isUserAuthenticatedPolicy, isLoggedInPolicie)


/**
 * user registration crud apis
 */
router.post('/auth/user/userSignup',UserController.userSignup)
router.post('/api/user/viewAllUser',UserController.viewAllUser)
router.post('/api/user/findUser',UserController.findUser)
router.post('/api/user/editUser',UserController.editUser)
router.post('/api/user/deleteUser',UserController.deleteUser)

/**
 * product crud apis
 */
router.post('/api/admin/createProduct',ProductController.createProduct)
router.post('/api/admin/listProduct',ProductController.listProduct)
router.post('/api/admin/viewProduct',ProductController.viewProduct)
router.post('/api/admin/editProduct',ProductController.editProduct)
router.post('/api/admin/changeProductStatus',ProductController.changeProductStatus)
router.post('/api/admin/deleteProduct',ProductController.deleteProduct)


/**
 * order crud apis
 */
router.post('/api/user/createOrder',OrderController.createOrder)
router.post('/api/user/listOrder',OrderController.listOrder)
router.post('/api/user/viewOrder',OrderController.viewOrder)
router.post('/api/user/editOrder',OrderController.editOrder)
router.post('/api/user/changeOrderStatus',OrderController.changeOrderStatus)
router.post('/api/user/deleteOrder',OrderController.deleteOrder)


router.get('/success', (req, res) => {
  res.sendFile(rootPath + '/views/success.html');
})
router.get('/cancel', (req, res) => {
  res.sendFile(rootPath + '/views/cancel.html');
})
router.get('/api/user/test', AuthController.test)
router.all('/*', encodeResPolicy)
module.exports = router
