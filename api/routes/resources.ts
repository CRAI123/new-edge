import express, { type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv' // Add dotenv import
dotenv.config() // Load environment variables

const router = express.Router()
const ADMIN_EMAIL = 'studio@post.rayzo.cn'

type ResourceStatus = 'draft' | 'published'

interface AuthedRequest extends Request {
  authUser?: {
    id: string
    email: string
    role: string
  }
  authToken?: string
}

// 获取环境变量
const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY as string

// 全局的 Supabase 客户端，用于认证操作 (例如 getUser)
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
      error: '权限不足：仅管理员可执行资源管理操作。',
    })
    return false
  }

  req.authUser = {
    id: authUser.id,
    email: authUser.email || '',
    role,
  }
  req.authToken = token

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
    folder_id,
  } = req.body

  if (!title || !file_url || !min_level) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段，请完整填写资源标题、链接和最低等级。',
    })
    return
  }

  const normalizedStatus: ResourceStatus = status === 'draft' ? 'draft' : 'published'

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.authToken}`,
      },
    },
  })

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
        folder_id,
        order_index: Date.now(), // default to current timestamp for order
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

router.get('/', async (req: Request, res: Response) => {
  const { folder_id } = req.query;

  // For GET requests, if there's a token, use an authenticated client for RLS checks
  // Otherwise, use the globalSupabase (e.g., for public access)
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  let supabaseForQuery = globalSupabase
  if (token) {
    supabaseForQuery = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }

  let query = supabaseForQuery.from('resources').select('*');

  if (folder_id) {
    query = query.eq('folder_id', folder_id);
  } else {
    // If no folder_id is specified, only return resources that are not in any folder
    // or handle global resources as before. For now, let's assume unassigned resources.
    query = query.is('folder_id', null);
  }

  const { data, error } = await query
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    res.status(400).json({
      success: false,
      error: `获取资源失败: ${error.message}`,
      code: error.code,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data,
  });
});

router.patch('/:id', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { title, category, file_type, file_url, downloads, min_level, status, folder_id } = req.body

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (title) updatePayload.title = title;
  if (category) updatePayload.category = category;
  if (file_type) updatePayload.file_type = file_type;
  if (file_url) updatePayload.file_url = file_url;
  if (downloads !== undefined) updatePayload.downloads = downloads;
  if (min_level) updatePayload.min_level = min_level;
  if (status) updatePayload.status = status;
  if (folder_id !== undefined) updatePayload.folder_id = folder_id;
  if (req.body.order_index !== undefined) updatePayload.order_index = req.body.order_index;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.authToken}`,
      },
    },
  })

  const { data, error } = await supabase
    .from('resources')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(400).json({
      success: false,
      error: `更新资源失败: ${error.message}`,
      code: error.code,
    })
    return
  }

  res.status(200).json({
    success: true,
    data,
  })
})

router.post('/reorder', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { updates } = req.body // Expecting an array of { id, order_index }

  if (!Array.isArray(updates)) {
    res.status(400).json({ success: false, error: 'Invalid payload format' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.authToken}`,
      },
    },
  })

  try {
    // Perform bulk updates concurrently
    await Promise.all(
      updates.map((update) =>
        supabase
          .from('resources')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      )
    )

    res.status(200).json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: `批量排序失败: ${err.message}` })
  }
})

router.patch('/:id/status', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const nextStatus: ResourceStatus = req.body?.status === 'draft' ? 'draft' : 'published'

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.authToken}`,
      },
    },
  })

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
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.authToken}`,
      },
    },
  })

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

