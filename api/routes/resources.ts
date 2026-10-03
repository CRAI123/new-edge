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
    cover_url,
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
        cover_url,
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
  const { title, category, file_type, file_url, downloads, min_level, status, folder_id, cover_url } = req.body

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
  if (cover_url !== undefined) updatePayload.cover_url = cover_url;
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

router.post('/generate-cover', async (req: AuthedRequest, res: Response) => {
  if (!(await requireAdmin(req, res))) return

  const { folder_name, resource_title, extra_prompt } = req.body

  if (!resource_title) {
    res.status(400).json({ success: false, error: '缺少课件名(resource_title)' })
    return
  }

  const basePrompt = `作为专业的资深教育课件UI设计师，请设计一张高质量的课件封面图。系列名（文件夹名）：${folder_name || '无'}，本课主题（课件名）：${resource_title}。${extra_prompt ? '额外要求：' + extra_prompt : ''}`
  const fullPrompt = `${basePrompt}
严格排版与视觉要求：
1. 【整体风格】主题色调必须是清新的浅绿色，辅以白色或相近的柔和色彩过渡。尺寸比例为严格的 1:1，整体必须具备极强的科技感、现代感和专业教育属性。
2. 【视觉层级-左上角】系列名（${folder_name || '无'}）必须作为副标题放置在画面的左上角，字体要小而精致。
3. 【视觉层级-正中央】本课主题（${resource_title}）是画面的绝对视觉中心，必须以最大、最粗的字号醒目地居中显示在画面正中央。文字周围要有适当的呼吸空间，切忌拥挤。
4. 【视觉层级-主题下方】如果课件名中包含课程编号（如"01"、"第一课"、"Unit 1"等），请将其单独提取并清晰、优雅地排列在本课主题的正下方。
5. 【视觉层级-底部】画面的正下方（底部边缘居中或偏右）必须包含品牌名"Rayzo"以及标语"让科创教育触手可及"。
6. 【图形元素】请在背景中巧妙融入一些与"3D打印、编程、科创、教育"相关的抽象几何图形或极简的3D线框元素，但必须做虚化或低对比度处理，绝不能喧宾夺主。
7. 【避错原则】画面排版必须整洁大气，确保所有文字内容极其清晰易读。严禁在文字背后添加杂乱的背景元素，严禁生成无意义的乱码文字。`

  const AI_API_KEY = process.env.IMAGE_AI_API_KEY || 'sk-ltZCJaWJvXLRAcOuMMSR1SZkEgJfL256n5ztnxUgXV93IQL0'
  const AI_API_URL = process.env.IMAGE_AI_API_URL || 'https://3hdmx.com/v1/images/generations'

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024'
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`AI API 错误 (${response.status}): ${errText}`)
    }

    const result = await response.json()
    console.log('AI API Response keys:', Object.keys(result));
    
    // 兼容返回 url 或者 base64 的情况
    let imageUrl = result.data?.[0]?.url
    
    if (!imageUrl && result.data?.[0]?.b64_json) {
      // 如果返回的是 base64 数据，需要将其转换为可展示的 data URI
      imageUrl = `data:image/png;base64,${result.data[0].b64_json}`;
    }
    
    if (!imageUrl && result.choices?.[0]?.message?.content) {
      // 尝试从 Markdown 格式的文本中提取图片 URL：![image](https://...)
      const content = result.choices[0].message.content;
      const match = content.match(/!\[.*?\]\((.*?)\)/);
      if (match && match[1]) {
        imageUrl = match[1];
      } else if (content.startsWith('http')) {
        // 或者直接返回的是链接
        imageUrl = content.trim();
      }
    }

    if (!imageUrl) {
      throw new Error(`AI API 未返回图片 URL。完整响应: ${JSON.stringify(result)}`)
    }

    res.status(200).json({
      success: true,
      data: { url: imageUrl }
    })
  } catch (err: any) {
    console.error('Generate cover error:', err)
    res.status(500).json({
      success: false,
      error: `生成封面失败: ${err.message}`
    })
  }
})

export default router

