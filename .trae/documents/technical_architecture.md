## 1. 架构设计
项目采用前后端分离架构，前端使用 React (Vite)，后端使用 Node.js (Express)，数据库与存储服务由 Supabase 提供。

## 2. 技术描述
- **前端**: React 18 + Tailwind CSS 3 + Vite
- **状态管理**: Zustand (用于处理用户信息与会员等级)
- **后端**: Node.js + Express (处理文件上传中转与复杂业务逻辑)
- **数据库/存储**: Supabase (Auth, PostgreSQL, Storage)

## 3. 路由定义
| 路由 | 用途 |
|-------|---------|
| `/` | 首页 |
| `/admin` | 管理员后台 (需管理员权限) |
| `/admin/resources` | 后台资源管理 |
| `/admin/users` | 后台用户管理 |
| `/profile` | 用户个人中心 (展示勋章) |

## 4. 数据模型
### 4.1 用户扩展信息 (Profiles)
- `id`: uuid (关联 Auth.users)
- `full_name`: text
- `role`: text (teacher/student/individual/admin)
- `level`: integer (1-4)
- `login_count`: integer
- `browse_count`: integer
- `download_count`: integer
- `avatar_url`: text

### 4.2 课程资源 (Resources)
- `id`: uuid
- `title`: text
- `category`: text (小学/初中/高中)
- `file_url`: text (Supabase Storage 链接)
- `file_type`: text
- `min_level`: integer (下载所需最低等级)
- `created_at`: timestamp

## 5. API 定义
### 5.1 管理员资源上传
- **URL**: `/api/admin/upload`
- **方法**: POST (Multipart/form-data)
- **权限**: 管理员专用

### 5.2 会员状态更新
- **URL**: `/api/admin/users/:id/level`
- **方法**: PATCH
- **请求体**: `{ "level": number }`
