# 🔒 DZDP Rating Generator — 安全审计报告

> 审计日期：2026-04-29
> 审计版本：v1.3.5 (commit `5e2007e`)
> 技术栈：React Native (Expo SDK 54) + JavaScript
> 审计范围：全量源码（1,417 行 JS，不含 node_modules）

---

## 📊 总览

| 维度 | 评级 | 说明 |
|------|------|------|
| **依赖安全** | 🟡 中风险 | 11 个 moderate 漏洞，均来自 Expo 间接依赖 |
| **敏感信息** | 🟢 低风险 | 已做 Base64 混淆，无明文密钥 |
| **代码安全** | 🟢 低风险 | 无 XSS/SQL 注入/路径遍历等 |
| **数据安全** | 🟡 中风险 | AsyncStorage 明文存储 API Key |
| **网络安全** | 🟢 低风险 | 全 HTTPS，Worker 有 Token 鉴权 + 限速 |
| **日志泄露** | 🟡 中风险 | 6 个文件含 console.error/log |

---

## 🔴 需要关注的问题

### 1. AsyncStorage 明文存储 API Key（中风险）

**位置**：`screens/HomeScreen.js:100`, `screens/ProviderDetailScreen.js:23,57`

用户配置的各厂商 API Key 通过 `AsyncStorage.setItem('@providers_config', JSON.stringify(providers))` 明文 JSON 存储。

**风险**：在已 root/越狱设备上，AsyncStorage 数据可被直接读取。

**建议**：
- 使用 `expo-secure-store` 替代 AsyncStorage 存储敏感配置
- 或至少对 API Key 做加密后存储

```javascript
// 推荐方案
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('@providers_config', JSON.stringify(providers));
```

### 2. 依赖漏洞 — postcss XSS（中风险）

**来源**：`npm audit` 报告

```
postcss <8.5.10 — moderate severity
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
```

**影响**：Expo SDK 54 依赖的 `@expo/metro-config` → `@expo/config` → `postcss` 链路受影响。

**现状**：这是构建工具链的依赖，不影响运行时 App。但如果 postcss 版本 < 8.5.10，在构建阶段存在潜在 XSS 注入风险。

**建议**：关注 Expo SDK 更新，升级到修复了此漏洞的版本。

### 3. 依赖漏洞 — uuid 缓冲区越界（中风险）

```
uuid <14.0.0 — moderate severity
Missing buffer bounds check in v3/v5/v6 when buf is provided
```

**影响**：`xcode` → `uuid` 链路，同样是构建时依赖。

**建议**：同上，跟随 Expo SDK 升级。

### 4. console.log/error 日志泄露（低风险）

**位置**：6 个文件共 ~15 处

| 文件 | 数量 | 内容 |
|------|------|------|
| `screens/HomeScreen.js` | 4 | 定位失败、更新检查失败、配置加载错误 |
| `services/llmService.js` | 1 | LLM API 完整错误对象 |
| `services/amapService.js` | 2 | 高德 API 错误 |
| `screens/SettingsScreen.js` | 1 | 配置加载错误 |
| `screens/ProviderDetailScreen.js` | 1 | 配置加载错误 |
| `cloudflare-worker/hawk-ai-proxy.js` | 1 | KV 读取错误 |

**风险**：生产环境 console 输出可能泄露 API 错误信息、内部 URL 等。

**建议**：
```javascript
// 方案1：生产环境屏蔽
if (__DEV__) {
  console.error('LLM API Error:', error);
}

// 方案2：使用 react-native-logs 等分级日志库
```

### 5. Base64 混淆 ≠ 加密（低风险）

**位置**：`constants/defaults.js:1-70`

当前方案：Base64 + 字符串反转 + 拆分存储。

**评估**：
- ✅ 能抵挡 grep/字符串搜索等静态扫描
- ✅ 对普通用户逆向有防护效果
- ❌ 对任何有 JS 调试经验的人，decode() 函数直接暴露解密逻辑
- ❌ React Native bundle 可被反编译查看源码

**建议**（按安全等级递增）：
1. **当前方案足够**：对于"防君子不防小人"的场景，当前混淆已够用
2. **升级方案**：使用 `react-native-aes-crypto` 加密存储，密钥派生自设备唯一标识
3. **终极方案**：不在客户端存储任何密钥，全部通过 Cloudflare Worker 代理（类似已实现的 hawk-builtin 模式）

---

## ✅ 安全亮点

### 1. Cloudflare Worker 代理架构（优秀）
- ✅ Worker 有 App Token 鉴权（`X-Hawk-Token` header）
- ✅ RPM 限速（14 req/min，留余量）
- ✅ Gemini API Key 存储在 Worker 环境变量中，不暴露给客户端
- ✅ CORS 配置合理（指定了 Allow-Methods 和 Allow-Headers）
- ✅ KV 限速失败时放行（不因限速服务故障影响用户）

### 2. 输入验证（良好）
- ✅ API Key 为空时提前返回（`llmService.js:20-22`）
- ✅ 图片数量限制（最多 9 张）
- ✅ 图片压缩处理（防止 413 Payload Too Large）

### 3. 无高危漏洞
- ✅ 无 XSS（无 innerHTML/dangerouslySetInnerHTML）
- ✅ 无 SQL 注入（无数据库操作）
- ✅ 无 eval/exec
- ✅ 无路径遍历
- ✅ 无硬编码明文密钥

### 4. 定位安全
- ✅ 定位超时保护（8 秒）
- ✅ 降级策略（缓存 → GPS → 静默失败）
- ✅ 权限申请合规

---

## 📋 优先级修复清单

| 优先级 | 问题 | 修复方案 | 工作量 |
|--------|------|----------|--------|
| **P0** | AsyncStorage 明文存储 API Key | 迁移到 expo-secure-store | 2h |
| **P1** | console.log 生产环境泄露 | 加 __DEV__ 判断或集成日志库 | 1h |
| **P2** | Expo 依赖漏洞 (postcss/uuid) | 跟随 Expo SDK 升级 | 等上游 |
| **P3** | Base64 混淆升级 | 评估是否需要 AES 加密 | 4h |

---

## 🔧 审计工具建议

本次审计使用手动代码审查 + npm audit。建议后续集成：

| 工具 | 用途 | 安装 |
|------|------|------|
| **Semgrep** | SAST 静态分析 | `brew install semgrep` |
| **ESLint + eslint-plugin-security** | JS 安全 lint | `npm i -D eslint-plugin-security` |
| **expo-secure-store** | 安全存储 | `npx expo install expo-secure-store` |
| **react-native-logs** | 分级日志 | `npm i react-native-logs` |

---

*审计由 Hermes Agent 自动生成，基于代码静态分析和 npm audit。不包含动态测试和渗透测试。*
