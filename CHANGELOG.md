# Changelog

本文档记录 **Hawk 大众点评评价生成器** 的所有版本更新内容。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [1.3.4] - 2026-04-29
### 修复
- **域名拼写纠正**：修正了 `hawkren.online` 的拼写错误，彻底解决“Network request failed”报错。

---

## [1.3.1] - 2026-04-29

---

## [1.3.0] - 2026-04-29

### ✨ 核心功能
- **内置 Hawk AI (Beta)**：预设免配置模型 (Gemma-4)，采用 Cloudflare Worker 中转保护，保障 API Key 安全。
- **大模型多提供商系统**：全新的设置界面，预设 15+ 主流 AI 提供商（DeepSeek, Gemini, Qwen, Kimi 等），支持自定义添加。
- **模型快速切换**：主页新增模型选择条，支持一键切换活跃模型。

### 🛡️ 安全与性能
- **请求限速 (RPM Control)**：对内置模型实施 15 RPM 限制，防止服务过载，并提供友好限速提示。
- **API 混淆存储**：内置接口地址与 Token 采用混淆编码，提升反逆向能力。

### 🐛 修复
- 优化了 llmService 的错误处理机制，支持解析自定义后端报错。

---

## [1.2.0] - 2026-04-29

### 修复
- **点评风格选择器白底白字 Bug**：原 `@react-native-picker/picker` 的 Android 原生下拉弹窗无法通过 React Native 样式控制背景色，导致在暗色主题下出现白底白字不可读的问题。
- 完全移除 `Picker` 组件，改用自定义的暗色 Modal 底部弹出选择器，风格与 App 整体暗金主题完全一致。

### 改进
- 风格选择器新增当前选中项高亮（金色背景 + 金色文字 + 勾选图标），选择体验更直观。

---

## [1.1.0] - 2026-04-28

### 新增
- **多卡片历史记录**：生成的点评不再覆盖上一次结果，而是以独立卡片的形式追加在下方，每张卡片显示生成时间戳和关联商铺名称，支持独立复制。
- **一键清空按钮**：主页顶部新增红色「一键清空」按钮，点击后立即重置已选图片、商铺信息和文字输入，便于快速开始下一篇点评。
- **`getFastLocation` 定位策略**：封装了优先读取缓存位置（`getLastKnownPositionAsync`，毫秒级）、失败降级 GPS（`getCurrentPositionAsync`，加 8 秒超时保护）的定位工具函数。

### 优化
- **高德搜索防抖**：商铺搜索输入框从同步触发改为 400ms 防抖延迟，大幅减少 API 请求次数，界面响应更流畅。
- **GPS 定位缓存**：App 启动时预获取一次定位并缓存；后续每次搜索复用缓存坐标，消除了之前每次输入都等待 GPS 冷启动（1~3 秒）的卡顿。
- **定位失败降级**：定位不可用时（如 VPN 干扰、GPS 信号弱）静默处理，不再弹出 Alert 打断用户，搜索列表保持空状态，引导用户直接手动输入商铺名搜索。

### 修复
- **EAS 构建 Java 版本**：`eas.json` 指定使用 `ubuntu-22.04-jdk-17-ndk-r25b` 镜像，修复 Android Gradle Plugin 要求 Java 17 但云端环境为 Java 11 导致构建失败的问题。
- **EAS 构建 Node 版本**：`eas.json` 指定 Node.js `20.18.3`，修复 `Array.prototype.toReversed` 在 Node 18 及以下不兼容导致的 Metro Bundler 报错。

---

## [0.1.0] - 初始发布

### 新增
- 基础 AI 点评生成功能（OpenAI 兼容 API，支持多模态）。
- 最多上传 9 张照片，压缩后以 base64 传入大语言模型。
- 高德地图 API 集成：周边商铺搜索（`searchAround`）和模糊联想（`getTips`）。
- 字数要求自定义输入（默认 200~300 字）。
- 简单感受文字输入（选填）。
- 生成结果一键复制到剪贴板。
- 设置页：自定义 API Base URL、API Key 和模型名称，持久化保存至 AsyncStorage。
- 暗色主题 UI，基于 Amber/Gold 主色调。
