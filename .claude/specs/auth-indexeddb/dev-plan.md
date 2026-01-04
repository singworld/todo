# 密码认证与 IndexedDB 持久化 - 开发计划

## 概述
实现基于单一密码（无用户名）的应用访问控制，登录状态通过 IndexedDB 永久存储，实现首次验证后自动登录。

## 任务分解

### Task 1: IndexedDB 认证存储服务
- **ID**: task-1
- **描述**: 使用原生 IndexedDB API 封装认证状态存储服务，提供数据库初始化、会话读写和清除功能。存储结构包含 `isAuthenticated` 标志和 `timestamp` 时间戳。
- **文件范围**:
  - `/srv/projects/todolist/src/services/authDb.ts` (新建)
  - `/srv/projects/todolist/src/services/__tests__/authDb.test.ts` (新建)
- **依赖**: None
- **测试命令**: `npm run test:unit -- src/services/__tests__/authDb.test.ts --coverage --coverage-include=src/services/authDb.ts`
- **测试重点**:
  - 数据库初始化和 schema 创建
  - getSession 返回正确的会话状态（存在/不存在）
  - setSession 成功写入并可读取
  - clearSession 清除后 getSession 返回 null
  - IndexedDB 不可用时的降级处理（返回错误或使用 fallback）

### Task 2: 认证逻辑 Composable
- **ID**: task-2
- **描述**: 实现 `useAuth` composable，管理认证状态、密码验证逻辑和初始化流程。提供响应式的 `authReady` 和 `isAuthed` 状态，以及 `login` 和 `init` 方法。密码从环境变量 `VITE_APP_PASSWORD` 读取。
- **文件范围**:
  - `/srv/projects/todolist/src/composables/useAuth.ts` (新建)
  - `/srv/projects/todolist/src/composables/__tests__/useAuth.test.ts` (新建)
- **依赖**: 依赖 Task 1 的类型定义（可通过 mock 独立测试）
- **测试命令**: `npm run test:unit -- src/composables/__tests__/useAuth.test.ts --coverage --coverage-include=src/composables/useAuth.ts`
- **测试重点**:
  - init() 调用后 authReady 变为 true
  - 已登录状态下 init() 自动设置 isAuthed = true
  - 未登录状态下 isAuthed 保持 false
  - login() 密码正确时返回 true 并更新 isAuthed
  - login() 密码错误时返回 false 且 isAuthed 保持 false
  - 环境变量未设置时的默认密码处理

### Task 3: 环境变量类型声明与示例配置
- **ID**: task-3
- **描述**: 为 Vite 环境变量 `VITE_APP_PASSWORD` 添加 TypeScript 类型声明，确保类型安全。创建 `.env.example` 文件提供配置示例。
- **文件范围**:
  - `/srv/projects/todolist/src/vite-env.d.ts` (新建或修改)
  - `/srv/projects/todolist/.env.example` (新建)
- **依赖**: None
- **测试命令**: `npm run build` (验证类型检查无错误)
- **测试重点**:
  - TypeScript 编译时无类型错误
  - `import.meta.env.VITE_APP_PASSWORD` 有正确的类型提示
  - .env.example 包含清晰的配置说明

### Task 4: 登录页 UI 与应用门禁逻辑
- **ID**: task-4
- **描述**: 创建登录页面组件，集成认证逻辑到 App.vue，实现根据认证状态显示登录页或主应用。登录页包含密码输入框、提交按钮和错误提示，使用 Tailwind 样式与现有设计保持一致。
- **文件范围**:
  - `/srv/projects/todolist/src/components/LoginView.vue` (新建)
  - `/srv/projects/todolist/src/App.vue` (修改)
  - `/srv/projects/todolist/src/components/__tests__/LoginView.test.ts` (新建)
- **依赖**: 依赖 Task 1、Task 2、Task 3
- **测试命令**: `npm run test:unit -- src/components/__tests__/LoginView.test.ts --coverage --coverage-include=src/components/LoginView.vue`
- **测试重点**:
  - 组件渲染密码输入框和登录按钮
  - 提交表单调用 login 方法并传递正确的密码
  - 登录失败时显示错误提示
  - 登录成功后触发状态更新
  - App.vue 根据 authReady 和 isAuthed 显示加载/登录/主应用
  - 键盘 Enter 键提交表单

## 接受标准
- [ ] 认证状态成功存储到 IndexedDB 并可跨会话持久化
- [ ] 首次访问显示登录页，密码验证通过后存储认证状态
- [ ] 后续访问自动读取 IndexedDB，已认证用户直接进入应用
- [ ] 密码从环境变量 `VITE_APP_PASSWORD` 读取，未设置时使用合理的默认值或提示
- [ ] 登录页 UI 符合 Tailwind + 暗色模式设计规范，响应式布局
- [ ] 所有单元测试通过，核心模块代码覆盖率 ≥90%
- [ ] TypeScript 类型检查无错误，环境变量有正确的类型声明
- [ ] 应用在 IndexedDB 不可用环境下有降级处理（提示或使用 sessionStorage）

## 技术要点
- **测试框架配置**: 项目当前无测试框架，需先安装 Vitest + @vue/test-utils + happy-dom，配置 vite.config.ts 添加 test 选项
- **IndexedDB 最佳实践**: 使用 Promise 包装回调 API，处理 onupgradeneeded 事件创建 object store，捕获 quota 错误
- **环境变量访问**: 使用 `import.meta.env.VITE_APP_PASSWORD`，构建时静态替换，不暴露到客户端
- **状态同步**: authReady 在 init() 完成前为 false，避免闪烁，App.vue 显示加载状态
- **密码安全**: 前端密码验证仅为演示/轻量级保护，不适合高安全场景，无需 hash（环境变量明文对比）
- **样式一致性**: 复用现有 Tailwind 类，参考 TimeBlockForm.vue 的弹窗样式和暗色模式 class
