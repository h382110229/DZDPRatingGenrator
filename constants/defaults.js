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
// 原字符串反转后 Base64: MXYvZW5pbG5vLm5lcmt3YWgueXhvcnAtaWEta3dhaC8vOnNwdHRo
const _p = 'MXYvZW5pbG5vLm5lcmt3YWgueXhvcnAtaWEta3dhaC8vOnNwdHRo';

// 混淆后的 Token
const _t = 'N1JwTm0zUWRrOXpYeF82MjAyX2t3YWg=';

// 混淆后的高德 Key
// 原字符串反转后 Base64: YmI1OGM2ODEwYzZmOTRjMjAxMjZiNjQ2MDgxZjBkYjQ=
const _a = 'YmI1OGM2ODEwYzZmOTRjMjAxMjZiNjQ2MDgxZjBkYjQ=';

const decode = (s) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  s = s.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < s.length; i += 4) {
    let enc1 = chars.indexOf(s.charAt(i));
    let enc2 = chars.indexOf(s.charAt(i + 1));
    let enc3 = chars.indexOf(s.charAt(i + 2));
    let enc4 = chars.indexOf(s.charAt(i + 3));
    let chr1 = (enc1 << 2) | (enc2 >> 4);
    let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    let chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return output.split('').reverse().join('');
};

export const getBuiltinConfig = () => {
  return {
    baseUrl: decode(_p),
    apiKey: decode(_t),
    model: 'gemma-4-31b-it',
    models: ['gemma-4-31b-it'],
    isBuiltin: true
  };
};

export const getAmapConfig = () => {
  return decode(_a);
};
