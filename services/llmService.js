/**
 * 调用大语言模型 API 生成点评
 * 兼容 OpenAI 的 Chat Completions API 格式
 *
 * @param {Object} params
 * @param {string} params.storeName 店铺名称
 * @param {string} params.userReview 用户的简单评价（可能为空）
 * @param {string} params.wordCount 字数建议
 * @param {Array<string>} params.images base64 格式的图片数组（带 data:image/jpeg;base64, 前缀）
 * @param {Object} params.style 选中的点评风格对象 { name, promptHint }
 * @param {Object} config API配置
 * @param {string} config.baseUrl API的Base URL
 * @param {string} config.apiKey API Key
 * @param {string} config.model 模型名称
 */
export const generateReview = async (params, config) => {
  const { storeName, userReview, wordCount, images, style } = params;
  const { baseUrl, apiKey, model } = config;

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  // 风格指令
  const styleName = style?.name || '真实好友安利型';
  const styleHint = style?.promptHint || '语气口语化，像给好友发消息推荐，真实自然。';

  // 构造 Prompt
  let promptText = `你是一个资深的大众点评V8用户，非常擅长写高质量、吸引人的真实探店评价。\n`;
  promptText += `现在我要为【${storeName || '这家店'}】写一条点评。\n\n`;

  promptText += `📌 点评风格：${styleName}\n`;
  promptText += `风格要求：${styleHint}\n\n`;

  if (userReview) {
    promptText += `我的简单感受是：${userReview}\n\n`;
  } else {
    promptText += `我没有提供具体感受，请根据常理或图片（如有）自由发挥，写一段积极正向的评价。\n\n`;
  }

  promptText += `字数要求：大约 ${wordCount || '200'} 字左右。\n\n`;

  promptText += `格式要求：\n`;
  promptText += `1. 适当使用 emoji 表情符号，让点评更生动活泼（但不要过度堆砌）。\n`;
  promptText += `2. 合理分段换行，结构清晰，符合大众点评热门点评的排版习惯。\n`;
  promptText += `3. 语气真实自然，不要太像 AI 生成，像一个真实的食客或顾客写的。\n`;
  promptText += `4. 直接输出点评正文，不需要任何多余的开头问候语或结尾说明。`;

  // 构造 OpenAI 格式的消息体
  const messageContent = [
    { type: 'text', text: promptText }
  ];

  // 如果有图片，加入多模态参数
  if (images && images.length > 0) {
    images.forEach(base64Image => {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: base64Image
        }
      });
    });
  }

  const requestBody = {
    model: model || 'LongCat-Flash-Chat',
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    temperature: 0.85, // 稍微提高创意度
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  // 如果是 Hawk 内置 Worker，使用特殊的 X-Hawk-Token
  if (baseUrl.includes('hawk-ai-proxy')) {
    headers['X-Hawk-Token'] = apiKey;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const endpoint = baseUrl.endsWith('/')
    ? `${baseUrl}chat/completions`
    : `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      // 透传内置 Worker 的限速报错
      if (data.hawk_error) {
        throw new Error(JSON.stringify(data));
      }
      throw new Error(data.error?.message || `请求失败: ${response.status}`);
    }

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error('API 返回格式异常：找不到 choices');
    }

  } catch (error) {
    console.error('LLM API Error:', error);
    throw error;
  }
};
