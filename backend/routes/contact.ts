import express, { type Request, type Response } from 'express'

const router = express.Router()

router.post('/', (req: Request, res: Response) => {
  const { name, email, phone, message } = req.body

  console.log('Received contact request:', { name, email, phone, message })

  // In a real app, you might save to DB or send an email here.
  
  res.status(200).json({
    success: true,
    message: '您的留言已收到，我们会尽快与您联系！',
  })
})

export default router
