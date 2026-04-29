# 🦅 Hawk 大众点评评价生成器

<div align="center">

![App Icon](./assets/icon.png)

**一键生成真实感强、风格多样的大众点评探店评价**

[![Version](https://img.shields.io/badge/version-1.1.0-gold)](https://github.com/h382110229/DZDPRatingGenrator/releases)
[![Platform](https://img.shields.io/badge/platform-Android-green)](https://github.com/h382110229/DZDPRatingGenrator/releases)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-blue)](https://expo.dev)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](./LICENSE)

[📥 下载最新 APK](https://github.com/h382110229/DZDPRatingGenrator/releases/latest) · [📋 查看更新日志](#-版本历史)

</div>

---

## 📖 项目简介

**Hawk 大众点评评价生成器** 是一款基于 React Native (Expo) 开发的移动端 App，通过接入大语言模型（LLM）的多模态能力，帮助用户在拍完照片后**一键生成**高质量、真实感强的大众点评风格探店评价。

只需三步：**选商铺 → 上传照片 → 点击生成**，即可得到一篇自然流畅的点评，直接复制发布。

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🤖 **AI 智能生成** | 接入 OpenAI 兼容 API，支持多模态模型（图片 + 文字 → 点评） |
| 🖼️ **多图上传识别** | 最多上传 9 张照片，AI 自动识别菜品、环境、细节 |
| 📍 **高德地图搜索** | 自动获取周边商铺（防抖 + 定位缓存，响应极速） |
| 🗂️ **多卡片历史记录** | 每次生成结果以卡片追加，可对比多版本内容 |
| 🗑️ **一键清空重置** | 顶部一键清空图片/商铺/文字，快速开始新一篇点评 |
| 📋 **一键复制** | 每张卡片独立复制按钮，直接粘贴到大众点评发布 |
| ⚙️ **自定义模型** | 支持自定义 API Base URL、Key 和模型名，兼容任意 OpenAI 格式服务 |

---

## 🛠️ 技术栈

- **框架**: React Native (Expo SDK 54)
- **语言**: JavaScript / React Hooks
- **定位**: 高德地图 Web 服务 API（`getLastKnownPositionAsync` 极速缓存策略）
- **AI 能力**: OpenAI 兼容 API（多模态，支持图片 base64 输入）
- **持久化**: `@react-native-async-storage/async-storage`
- **大文件**: Git LFS（APK 文件）
- **构建**: EAS Build (Expo Application Services) — JDK 17 + Node.js 20

---

## 🚀 快速开始

### 方式一：直接安装 APK（推荐）

前往 [Releases 页面](https://github.com/h382110229/DZDPRatingGenrator/releases/latest) 下载最新的 `Hawk_DZDP_Generator_v1.1.apk`，传输到 Android 手机安装即可。

> ⚠️ 安装时需要在手机设置中开启「允许安装未知来源应用」

### 方式二：本地开发运行

**1. 环境准备**

确保已安装 [Node.js 20+](https://nodejs.org/) 和 npm。

**2. 克隆并安装依赖**
```bash
git clone https://github.com/h382110229/DZDPRatingGenrator.git
cd DZDPRatingGenrator
npm install
```

**3. 配置 API Key**

打开 App → 右上角 ⚙️ 设置，填入：
- **API Base URL**：如 `https://api.openai.com/v1` 或其他 OpenAI 兼容服务地址
- **API Key**：您的密钥
- **模型名称**：如 `gpt-4o`、`gpt-4-vision-preview` 等支持多模态的模型

高德地图 Key 在 `services/amapService.js` 第 3 行替换为您自己的 Web 服务 Key。

**4. 启动开发服务器**
```bash
npm start
# 用 Expo Go App 扫码，或连接 Android 设备后运行：
npm run android
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
└── services/
    ├── amapService.js      # 高德地图 API 封装（周边搜索、模糊联想）
    └── llmService.js       # 大语言模型 API 封装（多模态生成）
```

---

## 📈 版本历史

### v1.1.0 (当前版本) — 2026-04-28
- ⚡ **高德 API 防抖优化**：搜索框加入 400ms 防抖，避免频繁请求
- ⚡ **定位极速缓存**：优先使用 `getLastKnownPositionAsync` 毫秒级返回，失败降级并加 8s 超时
- 🔕 **定位失败静默**：定位不可用时不再弹出 Alert 打断操作，可直接手动输入商铺名
- ✨ **多卡片历史记录**：生成结果不再覆盖，以卡片流形式追加，每张卡片含时间戳和店名
- ✨ **一键清空按钮**：顶部新增红色清空按钮，一键重置图片/商铺/文字输入
- 🔧 **EAS 构建修复**：升级至 JDK 17 镜像 + Node.js 20，修复 `toReversed` 兼容问题

### v0.1.0 — 初始版本
- 基础 AI 点评生成功能
- 高德地图周边商铺搜索
- OpenAI 兼容 API 接入
- 自定义 API 配置页

---

## 🤝 贡献 & 反馈

如有 Bug 或功能建议，欢迎提 [Issue](https://github.com/h382110229/DZDPRatingGenrator/issues)。

---

## 📄 开源协议

本项目仅供学习与个人使用，请勿用于商业用途。
