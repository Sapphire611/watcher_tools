# Watcher Tools

基于 Electron + Vue3 + TypeScript + Vite 的桌面应用脚手架

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 渐进式前端框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **electron-vite** - 专为 Electron 优化的构建工具
- **Vue Router** - Vue 官方路由
- **Pinia** - Vue 官方状态管理

## 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev
```

## 构建

```bash
# 构建应用
npm run build

# 打包 Windows 应用
npm run build:win

# 打包 macOS 应用
npm run build:mac

# 打包 Linux 应用
npm run build:linux
```

## 项目结构

```
src/
├── main/           # 主进程代码
├── preload/        # 预加载脚本
└── renderer/       # 渲染进程代码（Vue）
```

## 特性

- ✅ 开箱即用的 TypeScript 支持
- ✅ 主进程、预加载脚本、渲染进程分离
- ✅ 完整的 IPC 通信示例
- ✅ Vue3 组合式 API
- ✅ Vue Router 路由
- ✅ Pinia 状态管理
- ✅ 热更新支持

### 安装依赖

```bash
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install --save-dev electron
```
