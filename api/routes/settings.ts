import express, { type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()
const ADMIN_EMAIL = 'studio@post.rayzo.cn'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY as string
const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface AuthedRequest extends Request {
  authUser?: {
    id: string
    email: string
    role: string
  }
  authToken?: string
}

const requireAdmin = async (req: AuthedRequest, res: Response): Promise<boolean> => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || token === 'undefined' || token === 'null') {
    res.status(401).json({ success: false, error: '缺少登录凭证，请重新登录管理员账号。' })
    return false
  }

  const { data: authData, error: authError } = await globalSupabase.auth.getUser(token)
  if (authError || !authData.user) {
    res.status(401).json({ success: false, error: `登录校验失败: ${authError?.message || 'Token 无效'}` })
    return false
  }

  const authUser = authData.user
  const { data: profile } = await globalSupabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()

  const role = profile?.role || authUser.user_metadata?.role || 'individual'
  const isAdmin = authUser.email === ADMIN_EMAIL || role === 'admin'

  if (!isAdmin) {
    res.status(403).json({ success: false, error: '权限不足：仅管理员可执行操作。' })
    return false
  }

  req.authUser = { id: authUser.id, email: authUser.email || '', role }
  req.authToken = token
  return true
}

// Get banner settings (Public)
router.get('/banner', async (req: Request, res: Response) => {
  try {
    const { data, error } = await globalSupabase
      .from('global_settings')
      .select('value')
      .eq('id', 'announcement_banner')
      .maybeSingle()

    // 如果数据库里还没有这条记录（即使报错也忽略），直接返回默认值
    if (error || !data) {
      return res.status(200).json({
        success: true,
        data: { enabled: false, text: '', link: '' }
      })
    }

    res.status(200).json({
      success: true,
      data: data.value
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Update banner settings (Admin only)
router.post('/banner', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { enabled, text, link } = req.body

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${req.authToken}` } },
    })

    const { data, error } = await supabase
      .from('global_settings')
      .upsert({ 
        id: 'announcement_banner', 
        value: { enabled, text, link },
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ success: true, data: data.value })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
