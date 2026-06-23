/**
 * 调用大语言模型 API 生成点评
 * 兼容 OpenAI 的 Chat Completions API 格式
 */
export const generateReview = async (params, config) => {
  const { storeName, userReview, wordCount, images, style, rating, tags } = params;
  const { baseUrl, apiKey, model } = config;

  if (!apiKey) {
    throw new Error('请配置 API Key');
  }

  // 1. 动态构造人格与角色定位 (移除 V8 等可能产生代入感偏差的标签)
  const persona = `你是一个热爱生活、乐于分享的资深探店博主。你擅长观察店铺的细节（环境、服务、产品），并用真实、有温度且具备参考价值的文字记录下来。`;

  // 2. 风格指令
  const styleName = style?.name || '真实好友安利型';
  const styleHint = style?.promptHint || '语气口语化，像给好友发消息推荐，真实自然。';

  // 3. 构造评分与标签指令
  let moodInstruction = '';
  if (rating) {
    if (rating >= 4) {
      moodInstruction = `这是一次【非常满意】的体验，请用热情、积极的语气进行极力安利。`;
    } else if (rating === 3) {
      moodInstruction = `这是一次【一般/中规中矩】的体验，请保持客观中立，既写出亮点也要指出需要改进的地方。`;
    } else {
      moodInstruction = `这是一次【比较糟糕/避雷】的体验，请客观且犀利地指出问题所在，为其他消费者提供避雷参考。`;
    }
  }

  // 4. 组装 Prompt
  let promptText = `${persona}\n\n`;
  promptText += `我要为【${storeName || '这家店'}】写一条大众点评。\n\n`;

  promptText += `📌 评分：${rating ? '⭐'.repeat(rating) : '4星'}\n`;
  promptText += `📌 评价基调：${moodInstruction}\n`;
  promptText += `📌 选定风格：${styleName} (${styleHint})\n\n`;

  if (tags && tags.length > 0) {
    promptText += `📌 核心体验（请务必自然地融入文中，不要简单罗列）：${tags.join('、')}\n\n`;
  }

  if (userReview) {
    promptText += `📌 我的初步想法：${userReview}\n\n`;
  } else {
    promptText += `📌 特别要求：我没有提供具体感受，请结合评分和标签，模拟真实探店场景自由发挥，写出有画面感的细节。\n\n`;
  }

  promptText += `📌 字数建议：${wordCount || '200'} 字左右。\n\n`;

  promptText += `📜 创作规范：\n`;
  promptText += `1. 直接输出正文，拒绝“亲”、“大家好”等模版化开头，拒绝“总之”、“期待下次”等死板结尾。\n`;
  promptText += `2. 严格杜绝“作为一名AI”、“根据您的要求”等AI痕迹。文字要像真人手打，有呼吸感。\n`;
  promptText += `3. 合理分段，巧妙使用 emoji 增强视觉可读性。\n`;
  promptText += `4. 重点突出：让读者读完后能立刻 get 到这家店到底值不值得去。`;

  // 构造 OpenAI 格式的消息体
  const messageContent = [{ type: 'text', text: promptText }];

  if (images && images.length > 0) {
    images.forEach(base64Image => {
      messageContent.push({
        type: 'image_url',
        image_url: { url: base64Image }
      });
    });
  }

  const requestBody = {
    model: model || 'mimo-v2.5',
    messages: [{ role: 'user', content: messageContent }],
    temperature: 0.8,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

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
      if (data.hawk_error) throw new Error(JSON.stringify(data));
      throw new Error(data.error?.message || `请求失败: ${response.status}`);
    }

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error('API 返回格式异常');
    }
  } catch (error) {
    console.error('LLM API Error:', error);
    throw error;
  }
};
