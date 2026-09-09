# 订单系统重构 · 实施任务清单

## Task 1: 精简主导航栏 Navbar（删除订单生成+快递查询入口）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 读取 `src/components/Navbar.tsx` 的导航链接数组与渲染部分。
  - 删除桌面端与移动端 `navLinks` 中 "订单生成" 和 "快递查询" 两项。
  - 确保剩余项目为"首页 / 打印机推荐 / AI 辅导"三项，同时保留右侧登录区与搜索。
  - 验证移动端抽屉（< 768px）导航菜单同样删除两项。
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-1.1: 在 `Navbar.tsx` 中全文 grep `/order-generator` 与 `/logistics` 作为导航链接（非纯文字注释）出现次数为 0；证据 = `Grep` 输出。
  - `rule` TR-1.2: 桌面端 `navLinks` 数组长度为 3，分别为首页、打印机推荐、AI 辅导；证据 = 代码行片段。
  - `rubric` TR-1.3: 导航在 390px 宽度下的可读性；scale 1-5；anchors 1=溢出截断/5=完整且汉堡菜单可用；threshold >=4；证据 = 浏览器 DevTools 模拟 iPhone 宽度截图。
- **Notes**: 注意不要影响搜索输入框与登录状态徽章（Admin 皇冠徽标）。

## Task 2: 删除 Home 页核心卡中「订单生成器」与「快递轨迹查询」
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 定位 `src/pages/Home.tsx` 中的核心业务卡片区（「核心业务服务」四卡或两卡的 grid）。
  - 删除包含链接 `/order-generator`（FileCheck 图标）和 `/logistics`（Truck 图标）的两张卡。
  - 保留「打印机推荐」（Printer 图标）与「AI 辅导」（BookOpen 图标）。
  - 调整 grid 列数，使剩余两卡在 md/lg 宽度下居中对称展示（grid-cols-1 md:grid-cols-2）。
  - 删除代码中多余的 import（如 FileCheck 图标若未在其他地方使用可移除，Truck 同样可移除）。
- **Acceptance Criteria Addressed**: AC-2, AC-7
- **Test Requirements**:
  - `rule` TR-2.1: Home 核心卡区内 `<Link to="/order-generator">` 与 `<Link to="/logistics">` 出现次数 = 0；证据 = `Grep` 输出。
  - `rule` TR-2.2: 运行时首页核心卡数量为 2，分别是「打印机推荐」「AI 辅导」；证据 = 页面截图。
  - `rubric` TR-2.3: 两卡视觉平衡；scale 1-5；anchors 1=明显偏向一边或过大过小/5=视觉居中尺寸一致；threshold >=4；证据 = 首页截图。

## Task 3: 删除 Footer 核心业务中的订单与快递链接
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 定位 `src/components/Footer.tsx` 中的核心业务 `<ul>`。
  - 删除 `<li>` 「订单生成器」与「快递轨迹查询」两项。
  - 同步删除对应图标 import（仅当无其他使用）。
- **Acceptance Criteria Addressed**: AC-3, AC-7
- **Test Requirements**:
  - `rule` TR-3.1: `Footer.tsx` 中导航链接不包含 `/order-generator` 与 `/logistics`；证据 = grep 结果。
  - `rule` TR-3.2: 运行时目视检查 Footer 「核心业务」下不出现两项文字；证据 = 页面截图。

## Task 4: 删除 Admin Dashboard 快速入口中的快递查询卡
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 定位 `src/pages/Admin/Dashboard.tsx` 快速入口 grid。
  - 删除链接 `/logistics` 的「快递轨迹查询」卡片（Truck 图标、琥珀色渐变）。
  - 保留「订单生成器」卡片（管理员需要入口跳生成器）。
  - 移除 Truck 图标 import（如无其他用途）。
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-4.1: `Dashboard.tsx` 中不存在指向 `/logistics` 的 Link；证据 = grep 输出。
  - `rule` TR-4.2: 快速入口 grid 中「订单生成器」仍然存在；证据 = 页面截图。

## Task 5: 从 LogisticsTracker 抽离可复用的内嵌物流组件
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 在 `src/components/` 下新建 `EmbeddedLogisticsViewer.tsx`。
  - 复用原 `LogisticsTracker` 页面的查询逻辑（输入单号 → 调 `/api/logistics/query?no=` → 渲染结果列表 + 时间线地图）。
  - 对外 props：`initialTrackingNo?: string`；组件挂载时如 initialTrackingNo 非空则自动触发一次查询；否则允许手动输入。
  - 保持空状态、加载中（skeleton/shimmer）、错误态（含复制按钮的 error Toast 规范）。
  - 尺寸自适应父容器（不引入页面级的 hero 标题等，仅渲染查询框 + 结果）。
  - 保持 100% 响应式：手机端时间线图标缩小、单号列表换行不溢出。
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-9
- **Test Requirements**:
  - `rule` TR-5.1: 传入 `initialTrackingNo` 后组件在 3s 内发出查询请求并渲染结果；证据 = 浏览器 Network 面板截图 + 结果 UI 截图。
  - `rule` TR-5.2: 无初始单号时允许用户手动输入查询，同样可用；证据 = 手动查询截图。
  - `rule` TR-5.3: 错误 Toast 显示错误信息并包含复制按钮（遵循项目 Hard Constraints）；证据 = 手动传入错误接口时的 Toast 截图。
  - `rubric` TR-5.4: 组件在 390px 宽度下的完整度；scale 1-5；threshold >=4；证据 = 手机宽度截图。

## Task 6: 重构后台订单管理页：三合一集成（创建 + 状态管理 + 内嵌物流抽屉）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - 修改 `src/pages/Admin/OrderManager.tsx`：
    1. 新增订单详情抽屉状态：`selectedOrder`、`drawerOpen`、`drawerTab`（'detail' | 'logistics' | 'share'）。
    2. 将原跳转至 `/logistics?no=xxx` 的「轨迹查询」按钮改为 `setSelectedOrder(order); setDrawerTab('logistics'); setDrawerOpen(true);`。
    3. 在同一操作列内新增「详情」按钮或直接点击整行打开 detail Tab。
    4. 抽屉：≥ md 宽度为右侧 50% 宽度 Drawer（背景半透明遮罩 + 白色 shimmer 圆角 2.5rem）；< md 宽度为全屏弹层。
    5. 抽屉顶部三个 Tab 按钮：详情 / 物流追踪 / 分享生成。
    6. 详情 Tab：展示订单所有字段（order_no、客户、模型、金额、状态时间轴、tracking_no）+ 快捷按钮（更新状态/录入单号/删除/编辑跳转）。
    7. 物流追踪 Tab：渲染 `<EmbeddedLogisticsViewer initialTrackingNo={selectedOrder?.tracking_no}/>`；如无 tracking_no 提示先录入单号。
    8. 分享 Tab：调用原有 `handleGenerateShareMaterial` 并展示分享图 + 下载按钮。
  - 保持原有 Modal 功能（添加订单 / 更新状态 / 录入单号 / 分享图）不删除，抽屉分享 Tab 复用其函数。
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-9, AC-10
- **Test Requirements**:
  - `rule` TR-6.1: 点击订单行「轨迹查询」按钮后 `window.location.pathname` 不改变；证据 = 点击后地址栏仍为 `/admin/orders`。
  - `rule` TR-6.2: 抽屉物流 Tab 在有 tracking_no 的订单中自动出现查询结果；证据 = UI 截图。
  - `rule` TR-6.3: 「添加新订单 → 更新状态 → 录入单号 → 打开抽屉查询物流 → 生成分享图」五步连续无报错；证据 = dev server 终端无红色错误 + 5 步 Toast 全部 success。
  - `rule` TR-6.4: 宽度 ≤ 640px 时订单抽屉展开为全屏（非右侧半屏）；证据 = iPhone 宽度截图。
  - `rubric` TR-6.5: 抽屉三 Tab UI 与现有风格契合度（圆角/shimmer/渐变 CTA）；scale 1-5；threshold >=4；证据 = 抽屉截图。
  - `rubric` TR-6.6: 手机 ≤ 640px 整体可用性；scale 1-5；threshold >=4；证据 = 手机宽度操作录屏或多张截图。

## Task 7: 全流程串联验证（自动化人工核对清单）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1-6
- **Description**:
  - 执行多维度验证列表：
    ① Navbar 剩余三项检查。
    ② 后台订单管理：新建订单 → 改状态 → 录单号 → 开抽屉查物流 → 生成分享图（含二维码）→ 打开 `/order/:orderNo`。
    ③ 前台客户视角：从 Navbar、Home、Footer 看不到订单/快递入口；模拟未登录用户访问 Home/Footer/Navbar。
    ④ OrderTrack 页面与后台保存状态一致。
  - 所有改动文件运行 TypeScript 诊断 (`GetDiagnostics`) 通过。
- **Acceptance Criteria Addressed**: AC-6, AC-7, AC-8
- **Test Requirements**:
  - `rule` TR-7.1: GetDiagnostics 返回 []（无 lint/TS 报错）；证据 = 工具输出。
  - `rule` TR-7.2: 未登录前台全局（Navbar/Footer/Home 核心卡）找不到 「订单生成」「快递查询」「轨迹查询」「生成订单」字样的链接；证据 = grep 三张文件的 JSX 中无对应 Link。
  - `rule` TR-7.3: 从后台创建的订单在 OrderTrack 页面展示同一份 currentStatus；证据 = 两处同一订单号的状态 UI 截图。
  - `rubric` TR-7.4: 流程顺畅度（业务流程闭环）；scale 1-5；anchors 1=有步骤卡顿或状态不同步/5=一键流转无感知；threshold >=4；证据 = 完整链路描述 + 关键截图。

## Task 8: 修复响应式细节（对所有改动点做二次适配）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1-7
- **Description**:
  - 对 Navbar 移动端、Home 核心卡 2 列居中、Footer 小屏换行、Dashboard 快速入口、订单抽屉全屏模式分别进行 390px / 1024px 两档视觉走查。
  - 修复任何出现的水平滚动、按钮溢出、字号过大。
- **Acceptance Criteria Addressed**: AC-9, AC-10
- **Test Requirements**:
  - `rule` TR-8.1: iPhone 14（390×844）宽度下，`document.documentElement.scrollWidth === clientWidth`（无水平溢出）；证据 = DevTools 控制台 `window.innerWidth` 与滚动宽度比对截图。
  - `rule` TR-8.2: iPad Pro（1024px）宽度下订单抽屉为右侧半屏而不是全屏；证据 = iPad 宽度截图。
  - `rubric` TR-8.3: 综合视觉一致性；scale 1-5；threshold >=4；证据 = 390px / 1024px 双档截图。
