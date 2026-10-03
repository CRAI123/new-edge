import express, { type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js' // 引入 createClient
import dotenv from 'dotenv' // Add dotenv import
dotenv.config() // Load environment variables

// import { supabase } from '../utils/supabase.js' // 移除这行，我们将动态创建客户端

const router = express.Router()
const ADMIN_EMAIL = 'studio@post.rayzo.cn'

interface AuthedRequest extends Request {
  authUser?: {
    id: string
    email: string
    role: string
  }
  authToken?: string // 添加 authToken 字段来存储 JWT
}

// 获取环境变量
const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY as string

// 全局的 Supabase 客户端，用于认证操作 (例如 getUser)
// 注意：这个客户端不带用户的 JWT，所以不适合直接进行受 RLS 保护的数据库操作
const globalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

  // 使用 globalSupabase 进行认证，因为此时还没有用户特定的客户端
  const { data: authData, error: authError } = await globalSupabase.auth.getUser(token)
  if (authError || !authData.user) {
    res.status(401).json({
      success: false,
      error: `登录校验失败: ${authError?.message || '未获取到用户信息'}`,
    })
    return false
  }

  const authUser = authData.user
  const { data: profile, error: profileError } = await globalSupabase
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
      error: '权限不足：仅管理员可执行此操作。',
    })
    return false
  }

  req.authUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,
  }
  req.authToken = token // 将 token 存储在 req 对象中，以便后续使用

  return true
}

// Create a new folder
router.post('/', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { name, parent_id } = req.body

  if (!name) {
    res.status(400).json({
      success: false,
      error: '缺少文件夹名称。',
    })
    return
  }

  // 使用带有用户 JWT 的客户端进行数据库操作
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.authToken}`,
      },
    },
  })

  const { data, error } = await supabase
    .from('folders')
    .insert([{ name, parent_id, user_id: req.authUser?.id }])
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `创建文件夹失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(201).json({
    success: true,
    data,
  })
})

// Get all folders (or by parent_id/user_id)
router.get('/', async (req: AuthedRequest, res: Response) => {
  const { parent_id, user_id } = req.query

  let query = globalSupabase.from('folders').select('*')

  if (parent_id) {
    query = query.eq('parent_id', parent_id)
  }
  // Only allow fetching user-specific folders if the request is authenticated and matches the user_id
  // Or if an admin is requesting specific user's folders
  if (user_id) {
    if (req.authUser && (req.authUser.id === user_id || req.authUser.role === 'admin')) {
      query = query.eq('user_id', user_id)
    } else if (!req.authUser) {
       res.status(401).json({ success: false, error: '需要登录才能查看用户文件夹。' });
       return;
    } else {
       res.status(403).json({ success: false, error: '权限不足：无法查看其他用户的文件夹。' });
       return;
    }
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) {
    res.status(400).json({
      success: false,
      error: `获取文件夹失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

// Update a folder
router.patch('/:id', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { name, parent_id } = req.body

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${req.authToken}` } }
  })

  const { data, error } = await supabase
    .from('folders')
    .update({ name, parent_id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `更新文件夹失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

// Delete a folder
router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params

  // Optionally, handle resources within the folder: e.g., set their folder_id to NULL or delete them
  // For now, we'll assume Supabase's foreign key constraint with ON DELETE SET NULL or CASCADE is configured
  // If not, you'd need to manually update/delete related resources here.

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${req.authToken}` } }
  })

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (error) {
    res.status(400).json({
      success: false,
      error: `删除文件夹失败: ${error.message}`,
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
