import express from 'express'
const router = express.Router()
router.get('/success', (req, res, next) => {
  res.render('success', {
    title: 'Success'
  })
})

router.get('/error', (req, res, next) => {
  res.render('error', {
    title: 'Error'
  })
})

export default router
