# 订单系统重构 · 导航精简与后台全流程集成方案

## Overview
- **Summary**: 将原分散在前台的「订单生成器」和「快递轨迹查询」两个功能入口从客户侧的所有导航位置移除，只保留后台订单管理（/admin/orders）作为统一入口。在后台订单管理页内集成快递查询组件，打造订单创建→状态管理→物流追踪的一站式全流程，并确保所有改动页面在手机端正常展示。
- **Purpose**: 符合业务流程——所有订单均由后台运营手动创建和维护，客户无需发起查询，只通过后台发出的分享链接或二维码查看状态，消除客户侧功能冗余与业务割裂。
- **Target Users**: 后台 admin（使用三合一订单管理页）、客户（仅通过 /order/:orderNo 查看订单，无独立功能入口）。

## Goals
- 主导航栏（Navbar）仅保留核心业务导航项：首页、打印机推荐、AI 辅导、登录（右侧账户区）；移除"订单生成"与"快递查询"。
- 客户侧前端入口全部屏蔽：Navbar、Home 核心卡片、Footer 链接、Admin 后台 Dashboard 快速入口四处同步删除对应入口；Home 仅保留"打印机推荐"与"AI 辅导"两个核心卡片。
- 后台订单管理模块（/admin/orders）集中承载：①订单手动创建 ②订单全生命周期状态管理 ③嵌入物流查询组件（由原 LogisticsTracker 抽离而来）。
- 所有改动页在手机宽度下（≤ 640px）正常渲染、可交互。

## Non-Goals
- 不修改订单生成器页 `/order-generator` 的功能实现（仍保留作为后台跳转和分享图生成工具，但不再在客户侧导航中暴露）。
- 不修改公开追踪页 `/order/:orderNo` 的内容（这是分享链接跳转的合法目标页）。
- 不引入后端 API 变更，不改造 Supabase 数据表。
- 不删除 `/logistics` 路由（允许后台订单详情在内部通过 navigate 或 iframe 使用，但前端不暴露入口）。

## Background & Context
- 项目遵循四位置同步约定（Navbar / Home / Footer / Dashboard）；此前已在上一轮补全 Truck 导入与四个位置的入口，本次按业务要求反向删除并集中到后台。
- 现有 `AdminOrderManager`（src/pages/Admin/OrderManager.tsx）中已有「轨迹查询」按钮跳转至 `/logistics?no=xxx`，需升级为在订单管理页内嵌的 Tab 或抽屉内直接渲染物流查询组件，避免跳出。
- 现有 `LogisticsTracker` 页面（src/pages/LogisticsTracker.tsx）包含可复用的查询逻辑（按单号查询 + 多快递列表展示 + 地图时间线），抽离为 `EmbeddedLogisticsViewer` 组件即可在后台订单管理内复用。
- `OrderGenerator` 页面仍保留，供后台管理员在管理页内直接跳转生成订单分享图。

## Functional Requirements
- **FR-1 Navbar 精简**: 主导航链接中仅保留首页、打印机推荐、AI 辅导三项；桌面端右侧保留登录状态与搜索。
- **FR-2 Home 核心卡片缩减**: 删除 Home.tsx 中的「订单生成器」与「快递轨迹查询」核心卡片，保留打印机推荐、AI 辅导。
- **FR-3 Footer 核心业务缩减**: 删除 Footer 中的「订单生成器」与「快递轨迹查询」链接，保留打印机推荐、AI 辅导、创作工具箱等。
- **FR-4 Dashboard 快速入口缩减**: 删除 Admin Dashboard 快速入口中的「快递轨迹查询」卡；「订单生成器」保留（后台仍需要）。
- **FR-5 后台订单管理升级（三合一）**:
  - 在现有订单表格每行「轨迹查询」按钮处，不跳新页，而是打开右侧抽屉（Drawer），展示该订单的内嵌物流查询组件与订单详情。
  - 抽屉中包含三个 Tab：①订单详情 / ②物流追踪 / ③生成分享图；其中物流追踪 Tab 直接复用抽离的组件，自动带入该订单 tracking_no 并立即查询。
  - 保持「添加新订单」按钮与弹窗可用，保持「更新状态」「录入单号」「生成分享图」「编辑」「删除」功能完整。
- **FR-6 内嵌物流组件**: 从 LogisticsTracker 抽离 `<EmbeddedLogisticsViewer trackingNo={string}/>` 组件，支持手动换号查询、结果渲染与空状态；在后台订单管理抽屉与订单详情页复用。
- **FR-7 响应式**: Navbar / Home / Footer / Admin Dashboard / Admin OrderManager 五个改动点均在 ≤ 640px 宽度下正常（无溢出、可点击、无水平滚动）。

## Non-Functional Requirements
- **NFR-1 无破坏性**: 路由 `/order-generator`、`/logistics`、`/order/:orderNo`、`/admin/orders` 仍可直接访问（但客户侧导航不暴露）。
- **NFR-2 交互性能**: 订单管理抽屉动画流畅，物流查询结果 3s 内渲染；空加载状态友好。
- **NFR-3 风格一致**: 所有新抽屉、Tab、组件保持 Apple/Xiaomi 极简 + 蓝色描边卡片 + shimmer 风格。
- **NFR-4 持久化**: 物流组件的查询缓存、订单状态变更持久化与此前一致。

## Constraints
- **Technical**: 只能在现有 React+Vite+Tailwind 技术栈下修改，不得新增大型依赖。
- **Business**: 客户侧不得出现"快递查询"或"订单生成"的独立入口；任何订单的创建与物流维护均从后台发起。
- **Dependencies**: 依赖现有物流 API（后端 `/api/logistics/query?no=xxx`），若单号为空显示友好空态。
- **权限**: 内嵌物流组件仅在 `/admin/orders` 下使用，客户侧公开页不引入。

## Assumptions
- 现有管理员登录鉴权机制不变；用户到达 `/admin/orders` 时已具备管理员权限。
- LogisticsTracker 内部的 `handleQuery` 函数可以抽取为组件内部的 hooks，保持查询逻辑与视图分离。
- 手机端的订单抽屉可以改为全屏弹层，而不是右侧半屏，以适配小屏。

## Open Questions
- （保留）是否将 OrderGenerator 同样做成内嵌 Tab？本 Spec 决定：暂不嵌入，保留页面跳转方式，避免复杂度过高。

---

## Acceptance Criteria

### AC-1: Navbar 仅保留核心业务导航（rule）
- **Type**: `rule`
- **Given**: 用户访问首页或任何带 Navbar 的页面
- **When**: 查看顶部主导航链接
- **Then**: 主导航链接列表仅包含"首页 / 打印机推荐 / AI 辅导"三项；不得出现"订单生成"与"快递查询"
- **Pass Condition**: Navbar.tsx 中的导航数组/渲染项不包含前两者，目视检查只有三项
- **Evidence**: 读取 src/components/Navbar.tsx 相关段落 + 运行时浏览器 DOM 快照

### AC-2: Home 页核心卡片无订单/快递入口（rule）
- **Type**: `rule`
- **Given**: 用户访问首页
- **When**: 查看"核心业务服务"卡片网格
- **Then**: 卡片仅包含「打印机推荐」和「AI 辅导」（或等价的 2 张核心卡），不得有「订单生成器」或「快递轨迹查询」卡片
- **Pass Condition**: src/pages/Home.tsx 中核心卡 JSX 删除对应两张
- **Evidence**: Home.tsx 代码片段 + 运行时截图

### AC-3: Footer 核心业务无订单/快递入口（rule）
- **Type**: `rule`
- **Given**: 滚动到页面底部
- **When**: 查看 Footer 「核心业务」链接
- **Then**: 不得出现「订单生成器」与「快递轨迹查询」两条链接
- **Pass Condition**: src/components/Footer.tsx 核心业务 `<li>` 中不含对应两项
- **Evidence**: Footer.tsx 代码片段

### AC-4: Admin Dashboard 快速入口移除快递查询（rule）
- **Type**: `rule`
- **Given**: 管理员访问 /admin/dashboard
- **When**: 查看"快捷操作"卡片
- **Then**: 卡片列表不含「快递轨迹查询」；「订单生成器」卡保留
- **Pass Condition**: src/pages/Admin/Dashboard.tsx 中移除 Truck 卡
- **Evidence**: Dashboard.tsx 代码片段

### AC-5: 后台订单管理内嵌物流查询（rule）
- **Type**: `rule`
- **Given**: 管理员在 /admin/orders 订单列表中，任意一行点击「轨迹查询」按钮
- **When**: 触发点击
- **Then**: 1) 不跳转路由页面；2) 弹出右侧抽屉或全屏弹层；3) 抽屉内自动带入该订单 tracking_no 并调用查询接口渲染轨迹结果
- **Pass Condition**: 点击按钮不发生 location 变化，抽屉 UI 中出现与该单号匹配的物流记录
- **Evidence**: OrderManager.tsx 新增 Drawer 代码 + 运行时浏览器截图

### AC-6: 后台订单管理全流程功能有效（rule）
- **Type**: `rule`
- **Given**: 管理员在 /admin/orders 页面
- **When**: 执行：添加新订单 → 更新状态 → 录入单号 → 点击查询轨迹 → 生成分享图
- **Then**: 每一步均能正常触发、弹窗/抽屉渲染、数据刷新（无 TypeScript/运行时报错）
- **Pass Condition**: 连续 5 步操作无异常，终端日志无红色错误，Toast 均为 success
- **Evidence**: 终端 dev server 无红色错误输出 + 截图 5 个步骤

### AC-7: 客户侧无独立快递查询入口暴露（rule）
- **Type**: `rule`
- **Given**: 未登录或普通 student/individual 角色访问站点
- **When**: 遍历 Navbar / Home / Footer 三处可见位置
- **Then**: 任何文字链接、卡片中均不得出现"快递查询""轨迹查询""订单生成"字样及对应跳转
- **Pass Condition**: 对 Home/Footer/Navbar 全局全文 grep 不包含对应路由链接（按钮和 Link 标签）
- **Evidence**: grep 命令输出结果 + 运行时截图

### AC-8: 业务流程闭环一致（rule）
- **Type**: `rule`
- **Given**: 订单业务完整路径
- **When**: 后台添加订单 → 录入单号 → 内嵌查询 → 生成分享图含二维码 → 打开二维码链接
- **Then**: 客户端通过 /order/:orderNo 可实时看到订单状态；整个路径不要求客户侧发起任何"创建订单"或"查询单号"操作
- **Pass Condition**: 上述 6 步链路走通，二维码链接打开的 OrderTrack 页面与后台状态一致
- **Evidence**: 运行时链路截图 + URL 匹配

### AC-9: 多端响应式质量（rubric）
- **Type**: `rubric`
- **Dimension**: 五处改动页面（Navbar / Home / Footer / Dashboard / OrderManager 抽屉）在 ≤ 640px 宽度下的可用性
- **Scale**: 1-5
  - 1 = 明显水平滚动，内容溢出，按钮不可点击
  - 3 = 大体可看，部分组件未适配但仍可操作
  - 5 = 所有内容自适应，订单抽屉在手机端变为全屏弹层，操作按钮单手可达
- **Pass Threshold**: >= 4
- **Evidence**: 浏览器 DevTools 设备模拟 iPhone 14 宽度下的全屏截图

### AC-10: 视觉与风格一致性（rubric）
- **Type**: `rubric`
- **Dimension**: 新增抽屉/内嵌组件与现有 Apple 极简风契合度
- **Scale**: 1-5
  - 1 = 风格明显不搭，颜色/圆角/阴影不协调
  - 3 = 基本一致，细节有优化空间
  - 5 = 完美融合：圆角 2.5rem / shimmer 描边 / 渐变 CTA / 无多余装饰
- **Pass Threshold**: >= 4
- **Evidence**: 运行时内嵌物流组件 UI 截图
