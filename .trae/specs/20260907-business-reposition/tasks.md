# 业务定位改造 — 任务清单

- 对应 spec：`.trae/specs/20260907-business-reposition/spec.md`
- 前置条件：无（纯前端改造，不依赖后端）

---

## Task 1: Navbar 导航菜单替换
- **状态：pending**
- **优先级：high**
- **文件：** [Navbar.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/components/Navbar.tsx)
- **变更点：**
  1. 删除两个旧 `<Link>`：`/products` → "集成方案"，`/advice` → "硬件评测"
  2. 新增或重写对应菜单为：
     - `原创周边` → /products（路径复用，内容在 Task 3 换）
     - `创作工具` → /advice（路径复用，内容在 Task 4 换）
     - `课件资源` → /resources（保留）
     - `关于我们` → /team（保留）
- **测试要求 TR（rule）：** Navbar 顶部刷新后不再有 "集成方案 / 硬件评测" 两个词；4 个新菜单点击后路由跳转到正确路径（/products /resources /advice /team）
- **覆盖 AC：** AC-1

---

## Task 2: Footer 全量文案与链接重写
- **状态：pending**
- **优先级：high**
- **文件：** [Footer.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/components/Footer.tsx)
- **变更点：**
  1. 品牌介绍段落：去掉 "选购建议 / 实验室建设 / 硬件评测"
  2. "核心业务" 4 个 `<li>`：替换为 → 原创 IP 周边 / 信息科技课件 / 创作工具箱 / 科创活动与社群（保留跳转链接到合理路径）
  3. "教育资源" 4 个 `<li>`：保留或小幅改写（小学 / 初中 / 高中 / 教师培训 → 可留）
  4. "联系与支持"：删除 400 电话号码、删除任何 "售后 / 热线 / 24h / 立即联系" 的承诺；保留邮箱和地址，按钮可改为 "加入社群"（跳 /resources 或 /contact）
  5. 页脚法律链接：`<Link to="/sales">销售政策</Link>` → 文案改为 **"免责声明"**（仍跳 /sales，内容在 Task 5 换）
  6. 删除或替换图标 `Printer`（改为：Palette / Sparkles 等）
- **测试要求 TR（rule）：**
  - 关键字审查：Footer.tsx 字符串中 **不再出现**："选购 / 硬件 / 设备方案 / 授权 / 400 / 7×24 / 24 小时 / 售后 / 维保 / 实验室建设"
- **覆盖 AC：** AC-2, AC-7

---

## Task 3: /products 页面全量重写 = 原创 IP 周边介绍
- **状态：pending**
- **优先级：high**
- **文件：** [Products.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Products.tsx)
- **变更点：**
  1. 保留原文件路径，**清空旧硬件集成方案全部内容**
  2. 新结构：
     - Hero："原创 IP 周边 · 点亮创意"，工作室品牌故事（青少年创客 × 3D 创作）
     - 分类卡片（3-4 类）：潮玩手办 / 文创贴纸 / 教具周边 / 定制服务（每类放占位描述 + 占位图）
     - 服务说明：仅作为展示与定制咨询入口，不包含任何购买按钮或支付说明，明确写 "本站不提供线上商城，定制需求请邮件联系"
  3. 删除所有 "厂家授权 / 假一赔十 / 7×24 售后" 旧段落
- **TR-1（rule）：** Products.tsx 中不再出现 AC-2 黑名单关键字
- **TR-2（rule）：** 页面可见一段 "非销售 / 仅咨询" 的说明文案
- **覆盖 AC：** AC-2, AC-5

---

## Task 4: /advice 页面全量重写 = 创作工具箱
- **状态：pending**
- **优先级：high**
- **文件：** [Advice.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Advice.tsx)
- **变更点：**
  1. 删除旧内容：3D 打印机选购建议卡片 / "前往购买" 按钮 / 详情弹窗（含 buy_url 相关逻辑）
  2. 新结构：
     - 标题："创作者工具箱 · 让打印更高效"
     - 占位工具卡片 3-4 个：
       * 打印成本计算器（填入耗材单价 / 克数 / 电费等 → 占位按钮"即将上线"）
       * 切片参数速查表（PLA / ABS / PETG 常用参数速查，纯信息展示卡片）
       * G-code 体积与打印时长估算（占位）
       * 故障排查树（堵头 / 层分离 / 翘边 → 占位）
     - 底部文字：所有工具仅供参考，实际结果受环境/耗材/机器状态影响，自行承担风险
- **TR-1（rule）：** Advice.tsx JSX 中不再出现 "前往购买"、价格、品牌、buy_url 等展示词
- **TR-2（rubric 0-1）：** 至少展示 3 个工具卡片，点击不报错
- **覆盖 AC：** AC-2, AC-5, AC-7

---

## Task 5: /sales 页面全量重写 = 免责声明 + 服务说明
- **状态：pending**
- **优先级：high**
- **文件：** [Sales.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Sales.tsx)
- **变更点：**
  1. 删除全部旧销售政策：价格说明、物流、7×24 售后、7 天无理由机器退换、年度维保、授权、FAQ 卖哪些品牌等
  2. 新结构：
     - 一、网站定位声明（**明确总括**："睿造打印工坊（Rayzo Print Studio）**不销售任何硬件设备**。本站关于 3D 打印机 / 硬件 / 耗材等的历史或残留页面仅为教育资料或个人笔记，不构成任何购买、代理或官方推荐承诺。"）
     - 二、资源下载规则（课件授权使用范围、个人非商用、比赛展示授权）
     - 三、创作工具使用免责（工具仅基于经验，不对打印结果负责）
     - 四、原创周边定制说明（仅邮件咨询，不提供线上订单与支付）
     - 五、服务时间说明（**删除 7×24**，改为："本工作室为学生创客项目，响应时间为工作日 1~3 日邮件回复"）
     - 六、联系方式：仅邮箱 + 地址
- **TR-1（rule）：** 必须包含上述总括性不卖硬件段落
- **TR-2（rule）：** 不再出现 "7×24 / 24 小时上门 / 售后专线 / 假一赔十 / 年度维保"
- **覆盖 AC：** AC-2, AC-4 (对服务时间), AC-7

---

## Task 6: Team 关于我们 — 去年龄与去选型人设
- **状态：pending**
- **优先级：high**
- **文件：** [Team.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Team.tsx)
- **变更点：**
  1. members[0]（刘宸睿）bio：删除 "14岁的中学生" → 替换为中性、与年龄无关的创始人描述（参考示例："睿造 Rayzo 创始人 · 中学生创客 · 致力于让前沿的 3D 创作走入日常教育，让每个孩子都能享受创造的乐趣。"）
  2. members[2] 旧 "选型咨询主管" → 改角色为 **"IP 创作主管"** 或 **"产品研发主管"**，bio 改为 IP 形象 / 课件 / 工具产品相关
  3. Values 三张卡片：把 "专业中立 / 选购指导" 一张改成 **"原创至上" / "创作赋能" / "教育共享"** 其中之一，并改写描述
- **TR-1（rule）：** 文件任何字符串位置不再出现 "14岁" / "14 岁" / "硬件选型" / "设备性能" / "中立选购"
- **覆盖 AC：** AC-3, AC-2

---

## Task 7: Home 首页 — 核心服务区 + 统计数 + Hero 按钮改造
- **状态：pending**
- **优先级：high**
- **文件：** [Home.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Home.tsx)
- **变更点：**
  1. Hero 次级按钮文案："查看选购建议" → "探索创作工具"（仍跳 /advice）
  2. Hero 副描述（p.text-description）：去掉 "专业的 3D 打印设备选型建议" → 改写为 "…教育资源包、原创 IP 周边与实用的创作小工具…"
  3. Stat 4 列计数器：
     - "专业评测机型 42 款" → **"创作小工具 8+ 款"** 或 "原创 IP 形象 5+" 等符合新业务数字（保留 Printer 图标则替换为 Sparkles 或 Palette 图标）
     - 其余 3 列（合作学校 / 课件 / 好评率）如合理可留，否则改为 IP 周边、工具数量
  4. 核心业务三卡片（`[设备选型建议、信息科技课件、设备方案推荐]`）→ 替换为：
     - **原创 IP 周边**（/products）
     - **信息科技课件**（/resources，保留）
     - **创作工具箱**（/advice）
     同时改写 desc：desc 中不能出现 "购买指导 / 实验室建设 / 硬件评测"
  5. CTA 横幅段落："3D 打印选购指南" → 改 "创作工具更新邮件"
- **TR-1（rule）：** grep Home.tsx 展示文案：不出现 AC-2 的黑名单词
- **TR-2（rubric 0-2）：** 三卡片 100% 对齐新业务 = 2；大部分对齐 = 1；基本未改 = 0
- **覆盖 AC：** AC-2, AC-4

---

## Task 8: AIChatAssistant 人设改造（选购 → 资源/工具助手）
- **状态：pending**
- **优先级：high**
- **文件：** [AIChatAssistant.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/components/AIChatAssistant.tsx)
- **变更点：**
  1. 初始欢迎语去掉"推荐 3D 打印机 / 选购"，改为资源/工具/IP周边相关人设
  2. 全部 mock 回复（if/else 分支）中去掉 Bambu Lab、A1 mini、Anycubic、Photon Mono、K1C、Flashforge、Adventurer、价格￥1599、碳纤维材料 等全部硬件相关具体品牌 / 型号 / 价格；替换为：
     - 找课件 → "去 /resources 筛选对应学段的课件包"
     - 精度 / 手办 → "你可以在创作工具页使用切片参数速查表（PLA 0.2mm 层高起步）"
     - 成本 → "工具页面的打印成本计算器能帮你算克数和电费占比"
     - 通用 fallback → "需要了解原创周边 / 课件资源 / 创作工具，告诉我你的场景～"
  3. 标题 "选购助手预览" → 改 "睿造 AI 助手预览"
  4. 输入框 placeholder："询问选购建议..." → "询问课件 / 工具使用问题..."
- **TR-1（rule）：** 字符串中不再出现任何具体打印机品牌 / 型号 / 价格 / "选购" 字样
- **覆盖 AC：** AC-2, AC-6

---

## Task 9: Resources 分类 + Privacy / Terms 法律总括声明调整
- **状态：pending**
- **优先级：medium**
- **文件：**
  - [Resources.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Resources.tsx)
  - [Terms.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Terms.tsx)
  - [Privacy.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Privacy.tsx)
  - [Login.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Login.tsx)
  - [Register.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Register.tsx)
- **变更点：**
  1. Resources 的 `categories` 数组里 "选购与维护" 分类标题 → **"创作工具与技巧"**，description 相应改写
  2. Terms 顶部新增总括声明段落（与 Task 5 的总括内容一致，复制即可）；保留原条目但把 "硬件评测 / 购买链接 buy_url 免责 / AI 扫描硬件" 等段落改为 "…如存在硬件相关历史内容，仅为教育资料，不构成商业承诺"
  3. Privacy 相关 "硬件评测 / AI 扫描硬件" 的业务描述改写为中性（保留功能字，避免误解为在卖硬件）
  4. Login / Register 的 OTP 弹窗底部隐私条款小字：出现 "AI 扫描结果仅供参考，购买前以厂商为准" → 删除 "购买前" 三字 → "仅供参考，以官方资料为准"
- **TR-1（rule）：** 以上 5 个文件展示文案 grep "购买 / 售价 / 机器" = 0 次（除 Terms 内新增的免责声明总括说明，该段允许出现 "不卖硬件" 的措辞）
- **覆盖 AC：** AC-2, AC-7

---

## Task 10: 后台 Dashboard 移除 "设备管理" 快速入口
- **状态：pending**
- **优先级：medium**
- **文件：** [Dashboard.tsx](file:///c:/Users/26236/Documents/trae_projects/new%20edge/src/pages/Admin/Dashboard.tsx)
- **变更点：**
  1. "快速入口" grid 中 `<Link to="/admin/printers">设备管理</Link>` 整块卡片删除（保留 2 张：用户 + 资源；或删除后 grid-cols-2 改为 2 列无第 3 项空白）
- **TR-1（rule）：** 管理员后台 Dashboard 页刷新后不再渲染「设备管理 / 维护前台打印机数据」的可见链接与描述文本
- **覆盖 AC：** AC-1, AC-2

---

## Task 11: 构建验证 + 关键字回归 Grep
- **状态：pending**
- **优先级：high**
- **变更点：**
  1. 执行 `npm run check` 确认 tsc 0 error
  2. 执行 `npm run build` 确认成功
  3. 执行一次全站展示文案的关键字回归扫描（用 Grep，路径 `src/**/*.tsx src/**/*.ts`，过滤变量/类型名），确保 AC-2 黑名单词 0 次展示
- **TR-1（rule）：** check + build 都通过
- **TR-2（rule）：** 关键字 Grep 展示侧 0 命中（PrinterManager 等后台代码里的字段/URL 不算）
- **覆盖 AC：** AC-8, AC-2, AC-1
