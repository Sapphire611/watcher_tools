/*
 * electron-vite 三进程构建配置
 * ============================
 * Electron 应用分为三个独立进程，每个进程有不同的运行环境和构建要求：
 *
 *   main     → 主进程，运行在 Node.js 环境，负责窗口管理、系统调用、原生模块
 *   preload  → 预加载脚本，运行在 Node.js 环境，负责桥接主进程和渲染进程（contextBridge）
 *   renderer → 渲染进程，运行在 Chromium 浏览器环境，就是前端页面（Vue/React/...）
 *
 * 三者的构建产物互相独立，没有交叉引用。
 *
 * 核心概念：externalizeDepsPlugin
 * ────────────────────────────────
 * 当 vite/rollup 打包 main/preload 代码时，默认会把所有 import 的第三方库代码
 * 也打进产物里。但 main/preload 运行在 Node.js 环境——它能直接用 require() 从
 * node_modules 加载依赖，不需要打包。
 *
 * externalizeDepsPlugin 做的事：读取 package.json 的 dependencies，把它们标记为
 * Rollup 的 "external"（外部依赖），打包产物只保留你自己的代码，第三方库保持
 * require('mongoose') / require('electron') 这类原始引用，运行时从 node_modules 加载。
 *
 * 为什么 renderer 不用？因为浏览器环境没有 require()，所有依赖必须打包进 js bundle。
 */

import { resolve } from 'node:path'           // Node.js 路径拼接工具，把相对路径拼成绝对路径
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
//       ↑ electron-vite 提供的配置函数          ↑ 插件：自动把 node_modules 依赖标记为 external
import vue from '@vitejs/plugin-vue'           // vite 的 Vue SFC 编译插件，让 vite 能编译 .vue 文件
import AutoImport from 'unplugin-auto-import/vite'      // 自动导入插件：不用手写 import { ref } from 'vue'
import Components from 'unplugin-vue-components/vite'   // 自动注册组件插件：不用手写 import 和 components 注册
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'  // Element Plus 组件库的解析器

// 导出 electron-vite 配置对象
export default defineConfig({

  // ═══════════════════════════════════════════════════════════════
  // 一、主进程 (Main Process) 构建配置
  // ═══════════════════════════════════════════════════════════════
  // 产物输出到 out/main/index.js
  // 运行在 Node.js 环境，有 fs/path/net/child_process 等全部 Node API
  main: {
    // 插件列表
    plugins: [
      externalizeDepsPlugin()   // 所有 npm 依赖不打包，运行时从 node_modules require()
      // 注意：这里没有 vue() 插件！因为主进程不渲染 Vue 组件，只是纯 Node.js 代码
    ],

    // Rollup 打包配置（electron-vite 底层用 rollup 打包 main/preload）
    build: {
      rollupOptions: {
        input: {
          // 指定主进程入口文件 → 构建起点
          index: resolve(__dirname, 'src/main/index.ts')
          // resolve(__dirname, ...) 把相对路径拼成绝对路径，保证跨平台一致性
        }
      }
    },

    // 路径别名配置：在主进程代码中可以用 @main/xxx 代替 ../../../ 相对路径
    resolve: {
      alias: {
        '@main': resolve('src/main')    // import xxx from '@main/ipc' → 指向 src/main/ipc
        // 注意：主进程不能用 '@' 别名指向 renderer，也不能 import renderer 的代码
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 二、预加载脚本 (Preload Script) 构建配置
  // ═══════════════════════════════════════════════════════════════
  // 产物输出到 out/preload/index.js
  // 运行在 Node.js 环境（有 ipcRenderer、contextBridge），但又是一个受限的沙箱环境
  // 它的唯一职责：通过 contextBridge.exposeInMainWorld() 向渲染进程暴露安全 API
  preload: {
    // 插件列表
    plugins: [
      externalizeDepsPlugin()   // 同上，preload 也能 require()，依赖不打包
    ],

    // Rollup 打包配置
    build: {
      rollupOptions: {
        input: {
          // 预加载脚本入口文件
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    },

    // 路径别名：在 preload 代码中可以用 @preload 引用 preload 目录下的文件
    resolve: {
      alias: {
        '@preload': resolve('src/preload')
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 三、渲染进程 (Renderer Process) 构建配置
  // ═══════════════════════════════════════════════════════════════
  // 产物输出到 out/renderer/index.html（这就是一个普通的 vite 前端项目）
  // 运行在 Chromium 浏览器环境，只有 Web API（document/fetch/localStorage/...）
  // 不能直接访问 Node.js API 和文件系统（除非通过 preload 暴露的 api）
  renderer: {
    // 根目录：vite 从这个目录开始解析 HTML 入口和静态资源
    root: 'src/renderer',
    // 等价于在普通的 vite 前端项目的根目录跑 vite build

    // Rollup 打包配置
    build: {
      rollupOptions: {
        input: {
          // 渲染进程入口是一个 HTML 文件，不是 .ts 文件！
          index: resolve(__dirname, 'src/renderer/index.html')
          // vite 从 index.html 里的 <script type="module" src="..."> 找到 JS/TS 入口
        }
      }
    },

    // 路径别名
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),  // @renderer/xxx → 指向 renderer 源码目录
        '@': resolve('src/renderer/src')            // @/xxx → 同上，Vue 项目的常见约定
      }
    },

    // 渲染进程的 vite 插件（标准的 Vue 前端项目插件）
    plugins: [
      vue(),                        // 编译 .vue 单文件组件 → JS
      AutoImport({                  // 自动导入：不用写 import { ref, computed } from 'vue'
        resolvers: [
          ElementPlusResolver()     // 同时自动导入 Element Plus 的 API（如 ElMessage）
        ]
      }),
      Components({                  // 自动注册组件：不用在 components 里手动声明
        resolvers: [
          ElementPlusResolver()     // Element Plus 组件（如 ElButton）自动按需导入
        ]
      })
      // 注意：这里没有 externalizeDepsPlugin！浏览器不能 require()，所有依赖必须打包进 bundle
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // 四、全局配置
  // ═══════════════════════════════════════════════════════════════

  // 静态资源目录：开发时图片/字体等静态文件从这里 serve
  // 对应 src/renderer/public 目录，打包时内容直接复制到 out/renderer/ 根目录
  publicDir: resolve('src/renderer/public')
})

/*
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      构建产物目录结构                              │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                  │
 * │   out/                                                           │
 * │   ├── main/                                                      │
 * │   │   └── index.js       ← 主进程产物（你的代码 + external 引用）│
 * │   ├── preload/                                                   │
 * │   │   └── index.js       ← 预加载脚本产物                        │
 * │   └── renderer/                                                  │
 * │       ├── index.html     ← 渲染进程入口 HTML                     │
 * │       ├── assets/        ← 打包后的 JS/CSS/图片                  │
 * │       └── ...                                                    │
 * │                                                                  │
 * │   运行时加载顺序：                                                │
 * │   1. Electron 启动 → 加载 out/main/index.js（require 从          │
 * │      node_modules 加载第三方依赖）                               │
 * │   2. 创建 BrowserWindow 时指定 preload: 'out/preload/index.js'   │
 * │   3. BrowserWindow 加载 out/renderer/index.html → 前端启动       │
 * │                                                                  │
 * └─────────────────────────────────────────────────────────────────┘
 */
