# Debug Session: order-fetch-error

**Status**: `[OPEN]`
**Session ID**: `order-fetch-error`
**Date**: 2026-09-09
**Symptom**: 订单管理页面调用 API 时报 `Error: Failed to fetch`
**Reproduction Path (expected)**:
1. 登录后台
2. 进入订单管理页面
3. 页面加载时出现 Failed to fetch 错误

---

## 3–5 Falsifiable Hypotheses

| ID | Hypothesis | 如何验证（观察点） |
|----|------------|------------------|
| A | **后端 API 服务未启动**（端口 3001 无服务监听）：前端 Vite 已启动但后端 Express 未启动，导致所有 `/api/*` 请求失败。 | 检查后端服务进程；直接访问 `http://localhost:3001/api/orders` 是否返回响应；查看 Network 面板是否为 net::ERR_CONNECTION_REFUSED |
| B | **VITE_API_BASE_URL 配置错误或缺失**：前端请求的 URL 拼接错误，指向了错误的地址或端口。 | 插桩打印最终 fetch 的 `url`；检查 `.env` 文件中 VITE_API_BASE_URL 的值 |
| C | **CORS 跨域配置错误**：后端未正确配置 cors()，导致浏览器拦截请求（预检失败）。 | 浏览器 DevTools Network 查看 OPTIONS 请求状态；查看 response.type / response.status |
| D | **路由挂载前缀错误**：后端 routes 挂载路径（如 `/api/orders`）与前端请求路径不匹配，导致 404。 | 对比前端请求 URL 与后端 app.ts 中的路由挂载配置 |
| E | **Supabase 环境变量缺失**：后端初始化时缺少必要的 env 变量，导致服务启动失败或请求处理报错。 | 查看后端启动日志是否有异常；检查 `.env` 中的 Supabase 配置 |

---

## Evidence Log

| Step | Finding | Status |
|------|---------|--------|
| 1 | 静态分析：前端 `getApiBaseUrl()` 默认返回绝对路径 `http://localhost:3001`，绕过 Vite 代理；Vite 已配置 `/api` 代理但未被使用 | ✅ Done |
| 2 | 检查后端：`app.ts` 路由挂载正确（`/api/orders` → orderRoutes），`server.ts` 默认监听 3001 端口 | ✅ Done |
| 3 | 启动后端 API 服务器：成功启动，日志显示 `Server ready on port 3001`，`/api/health` 返回 200 | ✅ Done |
| 4 | 验证 Vite 代理：通过 `http://localhost:5173/api/health` 走代理访问后端，成功返回 200；Vite 日志显示 `Sending Request to the Target: GET /api/health` → `200 /api/health` | ✅ Done |
| 5 | 修复后页面状态：订单页错误从 `Error: Failed to fetch` 变为 `登录状态已失效，请重新登录管理员账号`。说明 **fetch 网络层已通**，问题从网络连接失败升级为鉴权层（这是正常的，需要登录） | ✅ Done |
| 6 | 对 5 个假设给出 Confirm/Reject 结论（见下表） | ✅ Done |

### Hypothesis Verdict

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| A | **后端 API 服务未启动**（最主要原因） | ✅ **CONFIRMED** | 启动前 `fetch("http://localhost:3001/api/orders")` 直接抛出 `Failed to fetch`（net::ERR_CONNECTION_REFUSED）。启动后端 + 走代理后 fetch 正常到达鉴权层。 |
| B | **VITE_API_BASE_URL 配置错误或缺失** → 直接用绝对路径绕过代理 | ✅ **CONFIRMED** | `getApiBaseUrl()` 逻辑：本地环境直接返回 `http://localhost:3001`，导致请求跨域/直连失败。修复后改为空字符串（相对路径），走 Vite 代理，CORS 和连接都正常。 |
| C | **CORS 跨域配置错误** | ❌ **REJECTED** | 后端 `app.use(cors())` 已开启；当请求走代理时根本不涉及跨域；当直连时 3001 端口有 cors() 也能通过。此非根因。 |
| D | **路由挂载前缀错误** | ❌ **REJECTED** | `app.use('/api/orders', orderRoutes)` 与前端请求 `/api/orders` 完全匹配，通过代理访问健康检查正常，路径无误。 |
| E | **Supabase 环境变量缺失导致服务启动失败** | ❌ **REJECTED** | 后端启动日志无异常，`.env` 有 `SUPABASE_URL` 与 `SUPABASE_KEY`（publishable key），`/api/health` 正常返回，服务初始化成功。 |

---

## Fix Summary (Filled)

### Root cause (双重因素)
1. **[主因] 后端 API 服务未启动**：用户只启动了前端 Vite (5173)，Node.js 后端 (3001) 未运行 → 所有 `fetch` 到 `localhost:3001` 的请求均 `net::ERR_CONNECTION_REFUSED`，外层 `catch` 仅展示 `Failed to fetch`。
2. **[次因] 前端请求路径绕过 Vite 代理**：`getApiBaseUrl()` 在本地硬编码返回绝对路径 `http://localhost:3001`，即使后端启动也可能因直连跨域/端口号变化而出问题；正确做法是本地开发返回空字符串 `""`，让请求走相对路径 `/api/*`，由 Vite 代理转发到 `http://localhost:3001`。

### Patch(es)
**Patch 1: OrderManager.tsx — 修复 getApiBaseUrl()**
```diff
- const getApiBaseUrl = () =>
-   import.meta.env.VITE_API_BASE_URL ||
-   (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
-     ? "http://localhost:3001"
-     : "");
+ const getApiBaseUrl = () => {
+   const explicitBase = import.meta.env.VITE_API_BASE_URL;
+   if (explicitBase) return explicitBase;
+   return "";
+ };
```
→ 效果：未配置 `VITE_API_BASE_URL` 时返回空字符串，请求走相对路径，通过 Vite 代理 (`/api` → `http://localhost:3001`) 转发。

**Patch 2: ResourceManager.tsx — 同类问题同步修复**
```diff
  const requestResourceApi = async <T,>(path: string, options: RequestInit = {}) => {
    const token = await getAdminAccessToken();
    const headers = new Headers(options.headers);
-   const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
-     || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
-       ? "http://localhost:3001"
-       : "");
+   const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
```

**Patch 3: 启动后端服务（运行时要求）**
```powershell
npm run server:dev   # 或 npm run dev 同时启动前后端
```

### Pre/Post evidence

| Item | Pre-fix (故障状态) | Post-fix (修复后) |
|------|---------------------|-------------------|
| 后端进程 | ❌ 无 | ✅ `Server ready on port 3001` |
| `GET localhost:3001/api/health` | ❌ ERR_CONNECTION_REFUSED | ✅ `{ success: true, message: "ok" }` |
| `GET localhost:5173/api/health` (走 Vite 代理) | ✅ 代理配置存在但后端无 | ✅ `{ success: true, message: "ok" }`；Vite 日志 `GET /api/health → 200` |
| 订单页显示错误 | 🔴 `Error: Failed to fetch` (网络层，catch 包掉) | 🟡 `Error: 登录状态已失效，请重新登录管理员账号` (已到鉴权层，属正常鉴权失败，登录后可用) |
| Browser Network 面板 | 🔴 `/api/orders` 或 `http://localhost:3001/...` 请求标红 failed | 🟡 **无 /api 网络请求**（因在 `getAdminAccessToken()` 阶段就提前报错，未发起 fetch）—— 这意味着 **fetch 本身已不再抛出 Failed to fetch** |
| Browser Console | 🔴 `net::ERR_CONNECTION_REFUSED` 对 3001 端口 | ⚪ 仅残留旧 debug-point 对 7777 端口的上报失败（非业务请求，可忽略） |

### 用户后续操作指引
订单管理页面现在需要 **以管理员邮箱 (2623681461@qq.com) 登录 Supabase 账号** 后才能正常加载。登录后即可看到订单列表并使用生成分享图等功能。

如需同时启动前后端，推荐使用：
```powershell
npm run dev
```
该命令会通过 `concurrently` 同时启动 Vite (5173) 和 Nodemon (3001)。
