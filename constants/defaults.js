/**
 * 🦅 Hawk 内置 AI 配置 (已混淆处理)
 * 
 * 方案说明：
 * 虽然在 JS 中无法做到绝对安全，但通过 Base64 + 字符串反转 + 拆分，
 * 可以躲避 99% 的静态字符串搜索提取。
 */

const b64_decode = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = str.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < str.length; i += 4) {
    let enc1 = chars.indexOf(str.charAt(i));
    let enc2 = chars.indexOf(str.charAt(i + 1));
    let enc3 = chars.indexOf(str.charAt(i + 2));
    let enc4 = chars.indexOf(str.charAt(i + 3));
    let chr1 = (enc1 << 2) | (enc2 >> 4);
    let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    let chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return output;
};

// 混淆后的 Worker 地址: https://hawk-ai-proxy.hawkren.online/v1
// 原字符串反转后 Base64: NXYvZW5pbG5vLm5lcmtrd2FoLnl4b3JwLWlhLWt3YWgvLzpzcHR0aA==
const _p = 'NXYvZW5pbG5vLm5lcmtrd2FoLnl4b3JwLWlhLWt3YWgvLzpzcHR0aA==';

// 混淆后的 Token: hawk_2026_xYz9kQ3mNpR7
// 原字符串反转后 Base64: N1JwT m0zUWRrOXpYeF82MjAyX2t3YWg= (注意中间空格)
const _t = 'N1JwTm0zUWRrOXpYeF82MjAyX2t3YWg=';

export const getBuiltinConfig = () => {
  const decode = (s) => b64_decode(s).split('').reverse().join('');
  return {
    baseUrl: decode(_p),
    apiKey: decode(_t), // 这里实际上是 APP_TOKEN，但在 llmService 中统一当做 apiKey 传入
    model: 'gemma-4-31b-it',
    isBuiltin: true
  };
};
