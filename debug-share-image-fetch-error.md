# Debug Session: share-image-fetch-error

**Status**: `[OPEN]`
**Session ID**: `share-image-fetch-error`
**Date**: 2026-09-08
**Symptom**: 管理后台「订单分享图」调用接口时报 `Error: Failed to fetch`
**Reproduction Path (expected)**:
1. 以管理员登录 Admin
2. 进入 /admin/orders，任开一条订单抽屉 → 切换到 Share Tab
3. 点击「生成图片」或在列表行直接点分享图入口 → 出现 Failed to fetch toast

---

## 3–5 Falsifiable Hypotheses

| ID | Hypothesis | 如何验证（观察点） |
|----|------------|------------------|
| A | **请求 URL / API Base URL 计算错误**（拼出来不可达）：例如 VITE_API_BASE_URL 未配置、或生产环境为空时拼接出错，或 path 拼重前缀。 | 插桩打印最终 `fetch(url, {...})` 的 `url`、method、headers、hasBody |
| B | **PATCH 请求触发 CORS / OPTIONS 预检失败**：后端 `cors()` 可能没放行 PATCH 或未正确响应预检，导致浏览器在预检阶段直接报 Failed to fetch（没有 response.json）。 | 浏览器 DevTools 看 Network：是否有 /generate-share-material 的 OPTIONS 请求及其 status；插桩 report fetch 的 `response.type / response.status`，若未 ok 则看 response.ok、statusText |
| C | **后端 API 服务根本未启动**（端口 3001 / VITE_API_BASE_URL 指定端口）或路径前缀错误（挂载到 /api/orders vs /orders）。 | 直接浏览器/ curl 访问 `GET /api/orders` 是否 200；同时插桩在发起前打印 `url`，并记录 `fetch` 抛出的 `err.name/err.message/err.cause` |
| D | **`Supabase access_token` 未取到导致抛错**（但外层 catch 仅展示 message，实际 Failed to fetch 来自 fetch 阶段）：作为兜底检查 token 是否存在。 | 插桩 token 获取结果（仅打印有/无及长度，不泄露 token）。 |
| E | **反向代理 / 部署路径问题**（若前后端同源反代部署时 PATCH 路由未被正确转发到 Express）。 | 对比 GET /api/orders 与 PATCH /api/orders/:id/generate-share-material 的 URL 前缀是否一致，Network 中是否表现为 404/405 且无响应体可读。 |

---

## Evidence Log

| Step | Finding | Status |
|------|---------|--------|
| 1 | 启动 Debug Server 并写入 `.dbg/share-image-fetch-error.env` | TBD |
| 2 | 在前端 `requestOrderApi` 与生成分享图入口处加插桩（仅 POST/PATCH 路径） | TBD |
| 3 | 复现一次生成分享图操作 | TBD |
| 4 | 读取 `trae-debug-log-share-image-fetch-error.ndjson`，对 Hypothesis A/B/C/D/E 给出 Confirm/Reject | TBD |
| 5 | 实施最小修复，并保留插桩做 post-fix 对比 | TBD |

---

## Fix Summary (to fill)

- Root cause:
- Patch(es):
- Pre/Post evidence:
