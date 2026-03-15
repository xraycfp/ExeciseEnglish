# EchoEnglish - 回音法英语练习

一款基于**回音法（Echo Method）** 的英语练习桌面应用，帮助你通过「听 → 回想 → 模仿 → 对比」的方式高效提升英语听说能力。

## 功能特性

### 媒体管理
- 导入本地视频（MP4、MKV、AVI、MOV、WebM、FLV、WMV）和音频（MP3、WAV、FLAC、AAC、OGG、M4A）
- 导入 MKV 等非 Web 原生格式时自动转码为 MP4（FFmpeg），确保音视频正常播放
- 自定义 `media://` 协议，支持 Range 请求和视频拖拽定位
- 自动保存和恢复播放位置

### 字幕导入
- 支持 **SRT** 字幕格式
- 支持 **ASS / SSA** 字幕格式（自动剥离样式标签）
- 自动去重流式 ASR 产生的重叠字幕
- 无字幕时可按固定时间间隔自动分段

### 回音法练习（Echo Practice）
四步循环训练法：
1. **Listen** — 播放原文片段
2. **Echo** — 暂停回想（可配置 1-10 秒）
3. **Record** — 录音 + 实时语音识别
4. **Compare** — 逐词对比差异（绿色=正确 / 黄色=遗漏 / 红色=多余），显示准确率

### 听写练习（Dictation）
- 听原文片段后在文本框中输入
- 提交后显示逐词对比和准确率评分
- 支持显示/隐藏答案

### 其他
- 片段导航：点击字幕跳转播放，播放时自动高亮当前片段
- 设置页面：回音暂停时长、API Key 配置（Anthropic、Azure Speech）

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Electron 33 + electron-vite 5 |
| 前端 | React 18 + TypeScript 5 + Vite 7 |
| 样式 | Tailwind CSS 3 |
| 路由 | react-router-dom 6 |
| 状态管理 | Zustand 4 |
| 录音 | MediaRecorder API (WebM/Opus) |
| 语音识别 | Web Speech API |
| 文本对比 | diff |
| 媒体转码 | ffmpeg-static |
| 数据存储 | JSON 文件数据库 (`userData/data/db.json`) |

## 项目结构

```
src/
├── main/                          # Electron 主进程
│   ├── index.ts                   # 应用入口、media:// 协议、窗口管理
│   ├── ipc-handlers.ts            # IPC 通道注册
│   └── services/
│       ├── database.service.ts    # JSON 文件数据库
│       ├── media-import.service.ts    # 媒体导入 + 格式转换
│       ├── media-convert.service.ts   # FFmpeg 转码服务
│       └── srt-import.service.ts      # SRT / ASS 字幕解析
│
├── preload/                       # 预加载脚本
│   └── index.ts                   # contextBridge 暴露 window.api
│
└── renderer/                      # React 渲染进程
    └── src/
        ├── App.tsx                # 路由配置
        ├── pages/                 # 页面
        │   ├── HomePage.tsx
        │   ├── LibraryPage.tsx
        │   ├── MediaDetailPage.tsx
        │   ├── SettingsPage.tsx
        │   └── practice/
        │       ├── EchoPracticePage.tsx
        │       └── DictationPage.tsx
        ├── components/            # UI 组件
        │   ├── layout/            # MainLayout, Sidebar
        │   ├── media/             # VideoPlayer, AudioPlayer
        │   └── transcript/        # SegmentList
        ├── hooks/                 # 自定义 Hooks
        │   ├── useAudioRecorder.ts
        │   └── useSpeechRecognition.ts
        ├── stores/                # Zustand 状态
        │   ├── media.store.ts
        │   └── transcript.store.ts
        └── types/
            └── media.types.ts     # 核心类型定义
```

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/<your-username>/EchoEnglish.git
cd EchoEnglish

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 构建

```bash
# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 使用指南

1. **导入媒体** — 在「媒体库」页面点击导入，选择视频或音频文件
2. **导入字幕** — 在媒体详情页点击「导入字幕」，选择 SRT 或 ASS 文件；或使用「自动分段」
3. **开始练习** — 选择「回音练习」或「听写练习」模式
4. **查看结果** — 练习后查看逐词对比和准确率评分

## 架构说明

应用采用 Electron 三进程模型：

- **Main 进程** — 应用生命周期、窗口管理、IPC 处理、文件系统操作、媒体转码
- **Preload 脚本** — 通过 `contextBridge` 暴露类型安全的 `window.api`，开启上下文隔离
- **Renderer 进程** — React SPA，通过 IPC 与主进程通信

所有 IPC 通信通过命名空间化的通道（`media:*`、`transcript:*`、`practice:*`、`settings:*`）进行。

## License

ISC
