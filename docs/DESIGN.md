# 🦅 Hawk 大众点评评价生成器 v2.0 — 设计文档

## 1. 项目概述

**项目名称**：Hawk 大众点评评价生成器
**版本**：2.0.0
**定位**：基于 AI 多模态能力，一键生成高质量大众点评探店评价的 Android 原生应用
**核心变化**：从 React Native (Expo) 改写为原生 Android (Kotlin + Compose)，本地打包无限制

### 1.1 改写动机

| 痛点 | 解决方案 |
|------|---------|
| Expo 云打包月度次数限制 | 原生 Android，本地 Gradle 打包，无限制 |
| UI 未曾专业设计 | 借 2.0 重新设计 UI |
| JS 混淆安全性不足 | Kotlin 编译后天然安全 |

### 1.2 与 v1.3.5 的关系

- **功能**：1:1 完整复刻，不增不减
- **UI**：重新设计，但功能布局保持一致
- **后端**：Cloudflare Worker 中转服务保持不变
- **版本号**：代码和 APK 统一标记为 v2.0.0

---

## 2. 功能清单

### 2.1 核心功能（11项，全部保留）

| # | 功能 | 描述 |
|---|------|------|
| 1 | 多图上传+压缩 | 最多9张，自动压缩至800px宽度，JPEG 70% |
| 2 | 高德地图商铺搜索 | 周边2km POI + 关键字联想搜索，400ms防抖 |
| 3 | 11种点评风格 | 随机/安利型/博主型/测评型/精华型/叙事型/挑剔型/节日型/商务型/文艺型/幽默型 |
| 4 | 15+ AI供应商切换 | Hawk内置/DeepSeek/Qwen/Gemini/LongCat/Kimi/GLM/MiniMax/Doubao/OpenAI/OpenRouter/Grok/Nvidia/硅基流动/自定义 |
| 5 | Hawk 内置 AI | 免配置即用，Cloudflare Worker 中转，gemma-4-31b-it |
| 6 | 多卡片历史记录 | 每次生成追加卡片，显示时间+商铺名 |
| 7 | 一键复制 | 单卡复制到剪贴板 |
| 8 | 自动更新检测 | 检查 GitHub Releases 最新版本 |
| 9 | 暗色主题 | 深灰背景 + 金色主色调 |
| 10 | 安全鉴权 | API Key 存云端，App 用混淆 Token |
| 11 | 字数自定义 | 用户可调整生成字数 |

### 2.2 页面结构（3个页面）

```
┌─────────────────────────────────────────────┐
│  HomeScreen（首页）                          │
│  ├─ 图片上传区（最多9张）                    │
│  ├─ 商铺选择（高德地图搜索）                 │
│  ├─ 点评风格选择（11种）                     │
│  ├─ 个人感受输入                             │
│  ├─ 字数设置                                 │
│  ├─ 模型选择（15+供应商）                    │
│  ├─ 生成按钮                                 │
│  └─ 生成记录（多卡片）                       │
├─────────────────────────────────────────────┤
│  SettingsScreen（供应商列表）                │
│  ├─ 当前活跃供应商                           │
│  └─ 所有供应商列表（状态标识）               │
├─────────────────────────────────────────────┤
│  ProviderDetailScreen（供应商配置）          │
│  ├─ API Key 输入                             │
│  ├─ Base URL 配置                            │
│  └─ 模型选择                                 │
└─────────────────────────────────────────────┘
```

---

## 3. 技术选型

| 层面 | 选型 | 说明 |
|------|------|------|
| **语言** | Kotlin | Android 官方推荐 |
| **UI 框架** | Jetpack Compose | 声明式 UI，代码量少，AI 生成效率高 |
| **最低 API** | 28 (Android 9.0) | 覆盖 95%+ 设备 |
| **目标 API** | 35 (Android 15) | 最新稳定版 |
| **架构** | MVVM + Repository | 标准分层，职责清晰 |
| **导航** | Navigation Compose | 官方导航方案 |
| **网络** | Retrofit + OkHttp | 标准网络栈 |
| **图片加载** | Coil | Compose 原生支持 |
| **本地存储** | DataStore Preferences | 替代 SharedPreferences |
| **定位** | FusedLocationProviderClient | Google Play Services |
| **地图** | 高德地图 Android SDK | 已有 Key |
| **异步** | Kotlin Coroutines + Flow | 官方推荐 |
| **依赖注入** | Hilt | 官方 DI 方案 |
| **构建** | Gradle KTS | 类型安全的构建脚本 |

### 3.1 关键依赖

```kotlin
// build.gradle.kts (app)
dependencies {
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.5")
    
    // Retrofit + OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Coil (图片加载)
    implementation("io.coil-kt:coil-compose:2.7.0")
    
    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    
    // Hilt
    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-android-compiler:2.51.1")
    
    // Location
    implementation("com.google.android.gms:play-services-location:21.3.0")
    
    // 高德地图
    implementation("com.amap.api:3dmap:latest.integration")
    implementation("com.amap.api:search:latest.integration")
}
```

---

## 4. 项目架构

### 4.1 目录结构

```
app/src/main/java/com/hawk/dzdpgenerator/
├── MainActivity.kt                    # 入口 Activity
├── HawkApp.kt                        # Application 类（Hilt 入口）
├── navigation/
│   └── NavGraph.kt                    # 导航图
├── ui/
│   ├── theme/
│   │   ├── Color.kt                   # 颜色定义
│   │   ├── Theme.kt                   # 暗色主题
│   │   └── Type.kt                    # 字体
│   ├── screens/
│   │   ├── home/
│   │   │   ├── HomeScreen.kt         # 首页
│   │   │   └── HomeViewModel.kt      # 首页逻辑
│   │   ├── settings/
│   │   │   ├── SettingsScreen.kt     # 供应商列表
│   │   │   └── SettingsViewModel.kt
│   │   └── provider/
│   │       ├── ProviderDetailScreen.kt
│   │       └── ProviderDetailViewModel.kt
│   └── components/
│       ├── ImageGrid.kt              # 图片网格组件
│       ├── StoreSelector.kt          # 商铺选择器
│       ├── StylePicker.kt            # 风格选择器
│       ├── ModelChip.kt              # 模型切换芯片
│       ├── ReviewCard.kt             # 评价卡片
│       └── UpdateDialog.kt           # 更新弹窗
├── data/
│   ├── model/
│   │   ├── ReviewStyle.kt            # 点评风格数据类
│   │   ├── Provider.kt               # AI供应商数据类
│   │   ├── Store.kt                  # 商铺数据类
│   │   └── ReviewResult.kt           # 生成结果数据类
│   ├── remote/
│   │   ├── LlmApi.kt                 # LLM API 接口
│   │   ├── AmapApi.kt                # 高德 API 接口
│   │   └── GithubApi.kt              # GitHub API（更新检测）
│   └── repository/
│       ├── LlmRepository.kt          # LLM 调用逻辑
│       ├── AmapRepository.kt          # 高德地图逻辑
│       └── ConfigRepository.kt        # 配置管理（DataStore）
├── di/
│   ├── AppModule.kt                   # Hilt 模块
│   └── NetworkModule.kt              # 网络模块
└── util/
    ├── ImageCompressor.kt             # 图片压缩工具
    ├── LocationHelper.kt              # 定位工具
    └── UpdateChecker.kt               # 更新检测工具
```

### 4.2 架构图

```
┌──────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ HomeScreen  │ │ Settings    │ │ Provider    │   │
│  │ + ViewModel │ │ + ViewModel │ │ + ViewModel │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
│         │               │               │           │
├─────────┴───────────────┴───────────────┴───────────┤
│                   Data Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ LlmRepo     │ │ AmapRepo    │ │ ConfigRepo  │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
│         │               │               │           │
├─────────┴───────────────┴───────────────┴───────────┤
│                 Network / Storage                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Retrofit    │ │ Amap SDK    │ │ DataStore   │   │
│  │ + OkHttp    │ │             │ │             │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 5. UI 设计规范

### 5.1 主题配色（沿用 v1.3.5）

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 背景 | `#1A1C20` | 深灰 |
| 卡片/表面 | `#2C323A` | 浅灰 |
| 主色调 | `#FFB300` | 金色/琥珀色 |
| 主文字 | `#FFFFFF` | 白色 |
| 副文字 | `#A0AAB5` | 灰色 |
| 边框 | `#3A414A` | 深灰 |
| 错误 | `#FF5252` | 红色 |
| 成功 | `#4CAF50` | 绿色 |

### 5.2 UI 设计工具

使用 **Google Stitch** 生成 UI 原型，然后转为 Compose 代码。

---

## 6. 开发里程碑

| 阶段 | 内容 | 预计耗时 |
|------|------|---------|
| **M1** | 项目骨架搭建（Gradle + 导航 + 主题） | 1天 |
| **M2** | HomeScreen 核心功能（图片+风格+生成） | 2-3天 |
| **M3** | 高德地图集成（商铺搜索） | 1天 |
| **M4** | Settings + ProviderDetail 页面 | 1天 |
| **M5** | 历史记录 + 复制 + 更新检测 | 1天 |
| **M6** | UI 打磨 + 测试 + 修 Bug | 2天 |
| **M7** | 签名打包 + GitHub Release 发布 | 半天 |

**总计**：约 8-10 天

---

## 7. 测试用例规划（待确认）

> 测试用例将在开发前单独规划，经确认后执行。

---

## 8. 发布计划

| 项目 | 说明 |
|------|------|
| **版本号** | v2.0.0 |
| **包名** | com.hawk.dzdpgenerator |
| **签名** | 生成新的 keystore |
| **发布渠道** | GitHub Releases |
| **产物** | APK（非 AAB，方便直接安装） |
| **CHANGELOG** | 记录从 RN 到原生的改写说明 |

---

## 9. 风险与约束

| 风险 | 应对 |
|------|------|
| 高德 Android SDK 申请 | 检查已有 Key 是否支持 Android SDK |
| Cloudflare Worker 需保持兼容 | Worker 端不改动，App 端适配 |
| 定位权限 | 首次启动请求，拒绝后降级为手动搜索 |
| 图片压缩性能 | 使用 Bitmap 硬件加速 |
