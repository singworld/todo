# TodoList 时间段日程管理应用

Vue 3 + TypeScript + Tailwind CSS 构建的时间段日程管理应用。

## 技术栈

- Vue 3.4 (Composition API)
- TypeScript 5.3
- Vite 5.0
- Tailwind CSS 3.4
- Pinia 状态管理

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查 + 构建
npm run build

# 预览构建结果
npm run preview
```

## 部署

### 快速部署

```bash
# 一键启动 (构建 + 运行)
./deploy.sh

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs
```

### 配置

编辑 `.deploy.env` 文件：

```bash
PORT=6000       # 服务端口
HOST=0.0.0.0    # 绑定地址
```

修改后执行 `./deploy.sh restart` 生效。

### 环境变量覆盖

也可以通过环境变量临时覆盖配置：

```bash
PORT=8080 ./deploy.sh
```

## 目录结构

```
src/
├── components/     # Vue 组件
├── stores/         # Pinia 状态管理
├── types/          # TypeScript 类型定义
├── App.vue         # 根组件
└── main.ts         # 入口文件
```

## License

MIT
