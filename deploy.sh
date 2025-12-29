#!/bin/bash
# 一键部署脚本 - 支持启动/停止/重启/状态查看

set -e

cd "$(dirname "$0")"

# 读取配置文件
if [ -f ".deploy.env" ]; then
    source .deploy.env
fi

# 环境变量可覆盖配置文件
PORT=${PORT:-3000}
HOST=${HOST:-0.0.0.0}

APP_NAME="todolist"
PID_FILE=".server.pid"
LOG_FILE="server.log"

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "⚠️  服务已在运行 (PID: $(cat $PID_FILE))"
        echo "   访问: http://${HOST}:${PORT}"
        exit 1
    fi

    echo "📦 安装依赖..."
    npm ci --prefer-offline 2>/dev/null || npm install

    echo "📦 构建项目..."
    npm run build

    echo "🚀 启动服务器 (端口: ${PORT})..."
    nohup npx vite preview --host ${HOST} --port ${PORT} > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    sleep 1
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "✅ 服务已启动"
        echo "   PID: $(cat $PID_FILE)"
        echo "   访问: http://${HOST}:${PORT}"
        echo "   日志: tail -f $LOG_FILE"
    else
        echo "❌ 启动失败，查看日志: cat $LOG_FILE"
        exit 1
    fi
}

stop() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            echo "🛑 停止服务 (PID: $PID)..."
            kill $PID
            rm -f "$PID_FILE"
            echo "✅ 服务已停止"
        else
            echo "⚠️  进程不存在，清理 PID 文件"
            rm -f "$PID_FILE"
        fi
    else
        echo "⚠️  服务未运行"
    fi
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "✅ 服务运行中"
        echo "   PID: $(cat $PID_FILE)"
        echo "   端口: ${PORT}"
        echo "   访问: http://${HOST}:${PORT}"
    else
        echo "⚫ 服务未运行"
    fi
}

logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "⚠️  日志文件不存在"
    fi
}

case "${1:-start}" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    logs)    logs ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "配置文件: .deploy.env"
        echo "  PORT=3000       # 服务端口"
        echo "  HOST=0.0.0.0    # 绑定地址"
        echo ""
        echo "示例:"
        echo "  ./deploy.sh           # 启动服务"
        echo "  ./deploy.sh stop      # 停止服务"
        echo "  ./deploy.sh restart   # 重启服务"
        exit 1
        ;;
esac
