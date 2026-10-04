import express, { type Request, type Response } from 'express'

const router = express.Router()

// 模拟用户数据库
const users: any[] = []

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body
  console.log('Login attempt:', email)
  
  // 模拟成功登录
  res.status(200).json({
    success: true,
    message: '登录成功',
    user: { email, name: '访客用户' }
  })
})

router.post('/register', (req: Request, res: Response) => {
  const { name, email, password, role, school } = req.body
  console.log('Register attempt:', { name, email, role, school })
  
  const newUser = { name, email, role, school }
  users.push(newUser)
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    user: newUser
  })
})

export default router
