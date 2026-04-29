/**
 * Hawk AI Proxy - Cloudflare Worker
 * 
 * 功能：
 *   1. App Token 鉴权（防止非 App 调用）
 *   2. RPM 限速（每分钟最多 15 次，对应 Gemini 免费额度）
 *   3. 转发请求至 Gemini OpenAI 兼容端点
 * 
 * 环境变量（在 Cloudflare Dashboard 中配置）：
 *   GEMINI_API_KEY  - 您的 Gemini API Key
 *   APP_TOKEN       - App 与 Worker 之间的共享鉴权 Token（自定义随机字符串）
 * 
 * KV 绑定（在 Cloudflare Dashboard 中配置）：
 *   RATE_LIMIT      - 用于存储 RPM 计数的 KV 命名空间
 */

// Gemini OpenAI 兼容端点
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';

// 每分钟最大请求数（对应 Gemini 免费 RPM 限制）
const MAX_RPM = 14; // 留 1 个余量，设为 14

export default {
  async fetch(request, env, ctx) {
    // ========== CORS 预检处理 ==========
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // ========== 1. 验证 App Token ==========
    const authHeader = request.headers.get('X-Hawk-Token');
    if (!authHeader || authHeader !== env.APP_TOKEN) {
      return corsResponse(
        JSON.stringify({ error: 'unauthorized', message: 'Invalid App Token' }),
        403,
        { 'Content-Type': 'application/json' }
      );
    }

    // ========== 2. RPM 限速检查 ==========
    const now = new Date();
    // Key 格式：rpm_2026042913_45 → 精确到分钟
    const minuteKey = `rpm_${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
    
    let currentCount = 0;
    try {
      const stored = await env.RATE_LIMIT.get(minuteKey);
      currentCount = stored ? parseInt(stored) : 0;
    } catch (e) {
      // KV 读取失败时放行（不因限速服务故障影响用户）
      console.error('KV read error:', e);
    }

    if (currentCount >= MAX_RPM) {
      return corsResponse(
        JSON.stringify({
          hawk_error: 'rate_limit',
          message: '🦅 Hawk 内置 AI 暂时繁忙，每分钟限制 15 次请求，请稍候重试或切换为自定义模型',
          retry_after: 60 - now.getUTCSeconds(), // 告知 App 还需等待几秒
        }),
        429,
        { 'Content-Type': 'application/json', 'Retry-After': String(60 - now.getUTCSeconds()) }
      );
    }

    // ========== 3. 转发请求到 Gemini ==========
    const url = new URL(request.url);
    // 将 /v1/... 映射到 Gemini 端点
    const targetPath = url.pathname; // 例如 /v1/chat/completions
    const targetUrl = `${GEMINI_BASE}${targetPath.replace(/^\/v1/, '')}${url.search}`;

    // 读取请求体
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }

    // 构造转发请求
    const geminiRequest = new Request(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GEMINI_API_KEY}`,
      },
      body: body,
    });

    let geminiResponse;
    try {
      geminiResponse = await fetch(geminiRequest);
    } catch (e) {
      return corsResponse(
        JSON.stringify({ error: 'upstream_error', message: '连接 AI 服务失败，请稍后重试' }),
        502,
        { 'Content-Type': 'application/json' }
      );
    }

    // ========== 4. 请求成功后，更新 RPM 计数 ==========
    if (geminiResponse.ok) {
      ctx.waitUntil(
        env.RATE_LIMIT.put(minuteKey, String(currentCount + 1), { expirationTtl: 120 })
      );
    }

    // ========== 5. 返回响应 ==========
    const responseBody = await geminiResponse.text();
    return corsResponse(responseBody, geminiResponse.status, {
      'Content-Type': geminiResponse.headers.get('Content-Type') || 'application/json',
    });
  }
};

// ========== 工具函数 ==========

function pad(n) {
  return String(n).padStart(2, '0');
}

function corsResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hawk-Token',
      ...extraHeaders,
    },
  });
}
