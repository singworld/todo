# Todo List 需求确认文档

## 原始请求
实现一个简单的 todo list

## 仓库上下文影响
- **项目状态**: Greenfield 项目,无现有代码库
- **技术约束**: 无遗留技术债,完全自由选择技术栈
- **用户语言**: 中文用户界面
- **现有内容参考**: todolist.md 中包含初始需求示例(工作/学习分类、优先级、具体任务)

## 需求确认过程

### 第一轮澄清 (质量分: 35/100)
**提出问题**:
1. 技术栈偏好
2. 核心功能范围
3. 用户界面形式
4. 数据存储方案

**用户回答**:
- 都需要(全功能)
- 纯前端 Web
- UI 形式,单用户
- 个人使用

### 第二轮澄清 (质量分: 60/100)
**提出问题**:
1. 前端技术栈选择 (React/Vue/原生)
2. 数据持久化方案 (LocalStorage/IndexedDB/无)
3. 功能细节(优先级级别、分类方式、编辑、截止日期、排序)
4. UI/UX 偏好(设计风格、暗黑模式、响应式)

**用户回答**:
- Vue 3 + TypeScript + Vite
- LocalStorage
- 所有功能都需要
- 简洁现代风格

### 第三轮澄清 (质量分: 85/100)
**提出问题**:
1. 优先级级别数量
2. 任务分类是否可自定义
3. 任务排序方式

**用户回答**:
- 3级优先级:高/中/低
- 固定分类:工作、学习
- 支持手动拖拽 + 自动排序切换

## 最终确认需求

### 功能需求 (Functional Clarity: 30/30)

#### 核心功能
1. **任务管理**
   - 添加新任务(标题、描述、分类、优先级、截止日期)
   - 编辑现有任务(所有字段可修改)
   - 删除任务(带确认提示)
   - 标记任务完成/未完成

2. **任务分类**
   - 固定分类:工作、学习
   - 默认分类:无分类
   - 按分类筛选显示

3. **优先级管理**
   - 三个级别:高、中、低
   - 默认优先级:中
   - 优先级可视化(颜色标识)

4. **截止日期**
   - 日期选择器设置截止日期
   - 可选功能(允许无截止日期任务)
   - 过期任务高亮提示

5. **任务排序**
   - 手动拖拽排序(保存用户自定义顺序)
   - 自动排序模式:
     - 按优先级(高→中→低)
     - 按截止日期(近→远)
     - 按创建时间
   - 手动/自动模式切换按钮

6. **数据持久化**
   - LocalStorage 存储所有任务数据
   - 页面刷新后保留数据
   - 导出/导入功能(JSON 格式,可选实现)

#### 用户交互
- 单页应用(SPA)
- 响应式设计(桌面/平板/手机)
- 键盘快捷键支持(可选)
- 空状态提示(无任务时显示引导)

#### 输入验证
- 任务标题:必填,1-200 字符
- 任务描述:可选,最多 1000 字符
- 截止日期:可选,不能早于今天
- 分类/优先级:下拉选择,无需验证

#### 成功标准
- 所有 CRUD 操作正常工作
- 数据刷新后保留
- 拖拽排序流畅无卡顿
- 移动端可正常使用

### 技术需求 (Technical Specificity: 25/25)

#### 技术栈
- **前端框架**: Vue 3.4+ (Composition API + `<script setup>`)
- **语言**: TypeScript 5.0+
- **构建工具**: Vite 5.0+
- **样式方案**: Tailwind CSS 3.4+
- **状态管理**: Pinia 2.0+ (或 Vue 3 Composition API)
- **UI 组件库**:
  - shadcn-vue (推荐)或手写组件
  - 日期选择器:VueDatePicker 或类似库
  - 拖拽库:VueDraggable Next
- **数据持久化**: LocalStorage API
- **类型定义**: 完整的 TypeScript 接口定义

#### 性能要求
- 首次加载时间 < 2 秒
- 支持 1000+ 任务数据量
- 拖拽操作延迟 < 100ms
- LocalStorage 大小限制检查(通常 5-10MB)

#### 浏览器支持
- Chrome/Edge 最新两个版本
- Firefox 最新两个版本
- Safari 最新两个版本
- 移动端浏览器(iOS Safari、Chrome Android)

#### 集成点
- 无后端 API
- 无第三方服务集成
- 纯本地运行

#### 部署方式
- 静态文件部署(Nginx/Apache/Vercel/Netlify)
- 单一 HTML 入口 + JS/CSS bundles

### 实现细节 (Implementation Completeness: 25/25)

#### 数据模型
```typescript
interface Task {
  id: string; // UUID
  title: string; // 任务标题
  description?: string; // 任务描述(可选)
  category: 'work' | 'study' | 'none'; // 分类
  priority: 'high' | 'medium' | 'low'; // 优先级
  dueDate?: string; // 截止日期(ISO 8601 格式)
  completed: boolean; // 完成状态
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  order: number; // 手动排序位置
}

interface AppState {
  tasks: Task[];
  filter: {
    category?: 'work' | 'study' | 'none';
    status?: 'all' | 'active' | 'completed';
  };
  sortMode: 'manual' | 'priority' | 'dueDate' | 'createdAt';
  theme: 'light' | 'dark';
}
```

#### 边界条件处理
1. **空状态**:
   - 无任务时显示友好提示和添加引导
   - 筛选无结果时显示"无匹配任务"

2. **LocalStorage 满**:
   - 捕获 QuotaExceededError
   - 提示用户清理旧任务或导出数据

3. **数据损坏**:
   - JSON 解析失败时使用空数组初始化
   - 记录错误日志到 console

4. **过期日期**:
   - 过期任务用红色高亮
   - 可选:过期任务自动排序到顶部

5. **并发操作**:
   - 单用户无并发问题
   - 多标签页共享 LocalStorage(使用 storage 事件同步)

#### 错误处理
- 表单验证错误:实时提示
- LocalStorage 错误:降级到内存存储 + 警告提示
- 日期解析错误:使用默认值
- 拖拽失败:回退到原始位置

#### 可访问性(a11y)
- 语义化 HTML 标签
- ARIA 标签(按钮、输入框、列表)
- 键盘导航支持(Tab/Enter/Esc)
- 颜色对比度符合 WCAG 2.1 AA 标准
- 屏幕阅读器友好

### 业务上下文 (Business Context: 20/20)

#### 用户价值主张
- **问题**: 个人任务管理混乱,缺少优先级和分类
- **解决方案**: 简洁的 Web 待办事项应用,支持分类、优先级、截止日期
- **核心价值**:
  - 本地数据,隐私安全
  - 无需注册登录,即开即用
  - 跨设备访问(通过浏览器)

#### 优先级定义
**P0(必须实现)**:
- 添加/编辑/删除任务
- 完成状态切换
- LocalStorage 持久化
- 基础 UI 布局

**P1(高优先级)**:
- 分类筛选(工作/学习)
- 优先级管理
- 截止日期功能
- 响应式设计

**P2(中优先级)**:
- 拖拽排序
- 自动排序模式
- 暗黑模式
- 过期任务提示

**P3(可选优化)**:
- 数据导出/导入
- 键盘快捷键
- 多标签页同步
- 任务统计面板

#### 使用场景
1. **日常任务管理**: 用户每天添加工作/学习任务,按优先级处理
2. **学习计划**: 设置学习任务截止日期,跟踪完成进度
3. **工作安排**: 区分工作和学习任务,合理分配时间
4. **移动端查看**: 手机浏览器快速查看今日待办

#### 性能指标
- 日活跃任务数: 10-50 条
- 历史任务累积: 最多 1000 条
- 单次操作响应: < 100ms
- 数据加载时间: < 500ms

## 最终质量评分: 95/100

### 评分详情
- **Functional Clarity (30/30)**:
  - ✅ 清晰的输入/输出规范
  - ✅ 详细的用户交互流程
  - ✅ 明确的成功标准

- **Technical Specificity (25/25)**:
  - ✅ 完整的技术栈定义
  - ✅ 明确的集成点
  - ✅ 具体的性能要求

- **Implementation Completeness (25/25)**:
  - ✅ 完整的数据模型
  - ✅ 全面的边界条件处理
  - ✅ 详细的错误处理策略

- **Business Context (15/20)**:
  - ✅ 清晰的用户价值主张
  - ✅ 明确的优先级定义
  - ⚠️ 无具体成功指标(个人项目可接受)

### 扣分原因
- 缺少具体的成功指标(如用户留存率、使用频率等) - 但对个人项目不适用,可忽略

## 与现有代码库集成

### 项目初始化步骤
1. 初始化 Vite + Vue 3 + TypeScript 项目
2. 安装依赖:Tailwind CSS、Pinia、VueDatePicker、VueDraggable
3. 配置 TypeScript(strict mode)
4. 配置 Tailwind CSS(包含暗黑模式)
5. 创建项目目录结构:
   ```
   src/
   ├── components/       # Vue 组件
   ├── composables/      # 组合式函数
   ├── stores/           # Pinia 状态管理
   ├── types/            # TypeScript 类型定义
   ├── utils/            # 工具函数
   └── App.vue           # 根组件
   ```

### 技术约束
- 必须使用 TypeScript strict mode
- 必须遵循 Vue 3 Composition API 最佳实践
- 必须使用 Tailwind CSS utility classes(避免自定义 CSS)
- LocalStorage key 统一前缀:`todolist_`

### 代码规范
- ESLint + Prettier
- Husky + lint-staged(可选)
- 组件命名:PascalCase
- 函数命名:camelCase
- 常量命名:UPPER_SNAKE_CASE

## 风险与假设

### 假设
1. 用户浏览器支持 LocalStorage(现代浏览器均支持)
2. 用户不会在多个设备间同步数据(纯本地存储)
3. 任务数量不会超过 1000 条(LocalStorage 容量足够)

### 风险
1. **低风险**: LocalStorage 数据丢失(浏览器清理缓存)
   - 缓解:提供数据导出功能
2. **低风险**: 浏览器兼容性问题
   - 缓解:使用成熟的 polyfill 和库
3. **低风险**: 性能问题(任务数量过多)
   - 缓解:虚拟滚动(任务 > 500 时实现)

## 下一步行动

### Phase 2 准备
等待用户审批后,将执行以下子代理链:
1. **requirements-generate**: 生成技术规范文档
2. **requirements-code**: 实现功能代码
3. **requirements-review**: 代码质量评审
4. **requirements-testing**(可选): 创建测试用例

### 初始化清单
- [ ] 创建 Vite + Vue 3 项目
- [ ] 安装所有依赖
- [ ] 配置 Tailwind CSS
- [ ] 设置 TypeScript 类型定义
- [ ] 创建目录结构
- [ ] 实现数据模型
- [ ] 开发 UI 组件
- [ ] 实现业务逻辑
- [ ] 测试所有功能
- [ ] 部署到静态托管

---

**文档生成时间**: 2025-11-18
**需求确认状态**: ✅ 已完成(95/100 分)
**等待用户审批**: 是
