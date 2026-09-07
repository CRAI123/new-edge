import express, { type Request, type Response } from 'express'
import { supabase } from '../utils/supabase.js'

const router = express.Router()
const ADMIN_EMAIL = '2623681461@qq.com'

type ResourceStatus = 'draft' | 'published'

interface AuthedRequest extends Request {
  authUser?: {
    id: string
    email: string
    role: string
  }
}

const requireAdmin = async (req: AuthedRequest, res: Response): Promise<boolean> => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({
      success: false,
      error: '缺少登录凭证，请重新登录管理员账号。',
    })
    return false
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    res.status(401).json({
      success: false,
      error: `登录校验失败: ${authError?.message || '未获取到用户信息'}`,
    })
    return false
  }

  const authUser = authData.user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileError) {
    res.status(500).json({
      success: false,
      error: `读取用户权限失败: ${profileError.message}`,
    })
    return false
  }

  const role = profile?.role || authUser.user_metadata?.role || 'individual'
  const isAdmin = authUser.email === ADMIN_EMAIL || role === 'admin'

  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: '权限不足：仅管理员可执行资源管理操作。',
    })
    return false
  }

  req.authUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,
  }

  return true
}

router.post('/', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const {
    title,
    category,
    file_type,
    file_url,
    downloads = 0,
    min_level,
    status = 'published',
  } = req.body

  if (!title || !category || !file_url || !min_level) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段，请完整填写资源标题、分类、链接和最低等级。',
    })
    return
  }

  const normalizedStatus: ResourceStatus = status === 'draft' ? 'draft' : 'published'

  const { data, error } = await supabase
    .from('resources')
    .insert([
      {
        title,
        category,
        file_type: file_type || 'FILE',
        file_url,
        downloads,
        min_level,
        status: normalizedStatus,
      },
    ])
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `数据库记录失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(201).json({
    success: true,
    data,
  })
})

router.patch('/:id/status', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const nextStatus: ResourceStatus = req.body?.status === 'draft' ? 'draft' : 'published'

  const { data, error } = await supabase
    .from('resources')
    .update({ status: nextStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `更新资源状态失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)

  if (error) {
    res.status(400).json({
      success: false,
      error: `删除资源失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data: { id },
  })
})

export default router
