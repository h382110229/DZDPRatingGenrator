# 🦅 Hawk 大众点评评价生成器

<div align="center">

![App Icon](./assets/icon.png)

**一键生成真实感强、风格多样的大众点评探店评价**

[![Version](https://img.shields.io/badge/version-1.3.4-gold)](https://github.com/h382110229/DZDPRatingGenrator/releases)
[![Platform](https://img.shields.io/badge/platform-Android-green)](https://github.com/h382110229/DZDPRatingGenrator/releases)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-blue)](https://expo.dev)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](./LICENSE)

[📥 下载最新 APK](https://github.com/h382110229/DZDPRatingGenrator/releases/latest) · [📋 查看更新日志](#-版本历史)

</div>

---

## 📖 项目简介

**Hawk 大众点评评价生成器** 是一款基于大语言模型（LLM）多模态能力的移动端 App，帮助用户在拍完照片后**一键生成**高质量、真实感强的大众点评风格探店评价。

**🚀 新增 Android 原生版本 (v1.3.4)**：采用 Kotlin + Jetpack Compose 重写，告别 Expo 云打包月度限制，启动更快、体积更小！

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🦅 **内置 Hawk AI** | **免配置即开即用**。通过 Cloudflare Worker 安全代理内置 Gemini/Gemma 模型。 |
| 🛡️ **安全鉴权体系** | API Key 存储于云端，App 采用混淆 Token 访问，杜绝反编译泄露 Key 风险。 |
| ⚡ **多供应商切换** | 预设 15+ 主流厂商（DeepSeek, Qwen, Kimi, Claude 等），支持自动获取模型列表。 |
| 🖼️ **多图上传识别** | 最多上传 9 张照片，AI 自动识别菜品、环境、细节（支持深度压缩防过大）。 |
| 📍 **高德地图搜索** | 自动获取周边商铺（防抖 + 定位缓存，响应极速）。 |
| 🗂️ **多卡片历史记录** | 每次生成结果以卡片追加，可对比多版本内容。 |
| 📋 **一键复制** | 每张卡片独立复制按钮，直接粘贴到大众点评发布。 |

---

## 🏗️ 架构说明 (v1.3.0+)

本项目在 v1.3.0 引入了 **"云端中转代理"** 架构，解决了移动端内置 API Key 的安全性痛点：

1. **App 端**：持有混淆后的 `Worker URL` 和 `App Token`。
2. **Worker 端**：在 Cloudflare 边缘运行，验证 `App Token` 有效性，并实施 **15 RPM** (每分钟请求数) 限速。
3. **API 端**：Worker 将请求安全转发至真实的 Gemini/OpenAI API，Key 仅存储在环境变量中，不随 APK 发布。

---

## 🛠️ 技术栈

### React Native 版本 (v1.3.5)
- **框架**: React Native (Expo SDK 54)
- **后端**: Cloudflare Workers (JS) + Workers KV (限速计数)
- **AI 能力**: OpenAI 兼容 API / Google Gemini
- **持久化**: `@react-native-async-storage/async-storage`
- **构建**: EAS Build — JDK 17 + Node.js 20

### Android 原生版本 (v1.3.4) 🆕
- **语言**: Kotlin 2.0.11 + Jetpack Compose
- **架构**: MVVM + Hilt 依赖注入
- **网络**: Retrofit 2.11.3 + OkHttp
- **UI**: Material Design 3 + 暗金主题
- **存储**: DataStore Preferences
- **构建**: Gradle + AGP 8.9.2

---

## 🚀 快速开始

### 方式一：直接安装 APK（推荐）

前往 [Releases 页面](https://github.com/h382110229/DZDPRatingGenrator/releases/latest) 下载最新的 APK：

- **Android 原生版**（推荐）：`Hawk_DZDP_Generator_v1.3.4.apk` - 更快启动、更小体积
- **React Native 版**：`Hawk_DZDP_Generator_v1.3.apk` - 功能完整

> ⚠️ 安装时需要在手机设置中开启「允许安装未知来源应用」

### 方式二：本地开发运行

**React Native 版**
```bash
git clone https://github.com/h382110229/DZDPRatingGenrator.git
cd DZDPRatingGenrator
npm install
npm start
```

**Android 原生版**
```bash
git clone https://github.com/h382110229/DZDPRatingGenrator.git
cd DZDPRatingGenrator/android-native
./gradlew assembleDebug
# APK 位于 app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 云端打包 APK（EAS Build）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 触发云端构建（输出 APK）
eas build -p android --profile preview
```

构建完成后，Expo 控制台会提供 APK 下载链接，约 5~15 分钟（含排队）。

---

## ⚙️ 项目结构

```
DZDPRatingGenrator/
├── App.js                  # 根组件，导航配置
├── app.json                # Expo 应用配置（版本号、包名等）
├── eas.json                # EAS 云端构建配置
├── index.js                # 入口文件
├── assets/                 # 图标、启动图等静态资源
├── constants/
│   └── theme.js            # 全局颜色、字体、间距设计 Token
├── screens/
│   ├── HomeScreen.js       # 主页面（图片上传、商铺选择、生成评价）
│   └── SettingsScreen.js   # 设置页（API Key、模型配置）
├── services/
│   ├── amapService.js      # 高德地图 API 封装（周边搜索、模糊联想）
│   └── llmService.js       # 大语言模型 API 封装（多模态生成）
├── android-native/         # 🆕 Android 原生版本
│   ├── app/src/main/java/com/hawk/dzdpgenerator/
│   │   ├── di/             # Hilt 依赖注入模块
│   │   ├── data/           # 数据层（Repository、API、DataStore）
│   │   ├── domain/         # 领域层（UseCase）
│   │   └── ui/             # UI 层（Compose Screens、ViewModel）
│   └── releases/           # 预编译 APK
└── releases/               # 发布 APK 存放目录
    └── Hawk_DZDP_Generator_v1.3.4.apk
```

---

## 📈 版本历史

### v1.3.4-native (Android 原生版) — 2026-05-01
- 🆕 **Kotlin + Jetpack Compose 重写**：告别 Expo 云打包月度限制
- 🆕 **Hilt 依赖注入**：标准化架构，便于测试和维护
- 🔧 **高德 API 兼容性修复**：tel 字段类型不一致导致的崩溃
- 🛡️ **安全加固**：API Key 混淆存储、HTTP 日志分级、硬编码 URL 清除

### v1.3.5 — 2026-04-29
- 🛡️ **全量敏感信息脱敏**：Base64 混淆处理，杜绝明文泄露

### v1.3.0 — 2026-04-29
- 🦅 **内置 Hawk AI 安全中转系统**
- ⚡ **多供应商切换**：预设 15+ 主流厂商
- 🛡️ **请求限速**：15 RPM 防滥用

### v1.1.0 — 2026-04-28
- ✨ 多卡片历史记录
- ⚡ 高德 API 防抖优化

### v0.1.0 — 初始版本
- 基础 AI 点评生成功能
- 高德地图周边商铺搜索

---

## 🤝 贡献 & 反馈

如有 Bug 或功能建议，欢迎提 [Issue](https://github.com/h382110229/DZDPRatingGenrator/issues)。

---

## 📄 开源协议

本项目仅供学习与个人使用，请勿用于商业用途。
