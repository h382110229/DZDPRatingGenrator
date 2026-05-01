package com.hawk.dzdpgenerator.data.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AllInclusive
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeveloperBoard
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

data class AIProvider(
    val id: String,
    val name: String,
    val description: String,
    val icon: ImageVector,
    val iconTint: Color,
    val isBuiltIn: Boolean = false,
    val hasConfig: Boolean = true,
    val defaultBaseUrl: String = "",
    val defaultModels: List<String> = emptyList()
)

data class ProviderConfig(
    val providerId: String,
    val apiKey: String = "",
    val baseUrl: String = "",
    val selectedModel: String = ""
)

object ProviderRegistry {
    val providers = listOf(
        AIProvider(
            id = "hawk_builtin",
            name = "Hawk 内置 AI",
            description = "系统默认，无需配置",
            icon = Icons.Filled.Star,
            iconTint = Color(0xFFFFBA38),
            isBuiltIn = true,
            hasConfig = false
        ),
        AIProvider(
            id = "deepseek",
            name = "DeepSeek",
            description = "性价比极高的国产模型",
            icon = Icons.Filled.AutoAwesome,
            iconTint = Color(0xFFFF9800),
            defaultBaseUrl = "https://api.deepseek.com/v1",
            defaultModels = listOf("deepseek-chat", "deepseek-coder")
        ),
        AIProvider(
            id = "qwen",
            name = "Qwen",
            description = "阿里巴巴通义千问",
            icon = Icons.Filled.AllInclusive,
            iconTint = Color(0xFF9C27B0),
            defaultBaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1",
            defaultModels = listOf("qwen-turbo", "qwen-plus", "qwen-max")
        ),
        AIProvider(
            id = "gemini",
            name = "Gemini",
            description = "Google 强大的多模态模型",
            icon = Icons.Filled.AutoAwesome,
            iconTint = Color(0xFF42A5F5),
            defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta",
            defaultModels = listOf("gemini-pro", "gemini-pro-vision")
        ),
        AIProvider(
            id = "longcat",
            name = "LongCat",
            description = "超长上下文处理专家",
            icon = Icons.Filled.Pets,
            iconTint = Color(0xFFFFE0B2),
            defaultModels = listOf("longcat-chat")
        ),
        AIProvider(
            id = "kimi",
            name = "Kimi",
            description = "月之暗面长文本模型",
            icon = Icons.Filled.AutoAwesome,
            iconTint = Color(0xFFFFF9C4),
            defaultBaseUrl = "https://api.moonshot.cn/v1",
            defaultModels = listOf("moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k")
        ),
        AIProvider(
            id = "glm",
            name = "GLM",
            description = "智谱 AI 基座模型",
            icon = Icons.Filled.Psychology,
            iconTint = Color(0xFFAEEA00),
            defaultBaseUrl = "https://open.bigmodel.cn/api/paas/v4",
            defaultModels = listOf("glm-4", "glm-4-flash")
        ),
        AIProvider(
            id = "minimax",
            name = "MiniMax",
            description = "通用大模型技术",
            icon = Icons.Filled.MusicNote,
            iconTint = Color(0xFF5C6BC0),
            defaultModels = listOf("abab6.5-chat")
        ),
        AIProvider(
            id = "doubao",
            name = "Doubao",
            description = "字节跳动自研大模型",
            icon = Icons.Filled.FiberManualRecord,
            iconTint = Color(0xFFEF5350),
            defaultModels = listOf("doubao-pro-32k")
        ),
        AIProvider(
            id = "openai",
            name = "OpenAI",
            description = "行业标杆 GPT 系列",
            icon = Icons.Filled.Hub,
            iconTint = Color.White,
            defaultBaseUrl = "https://api.openai.com/v1",
            defaultModels = listOf("gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo")
        ),
        AIProvider(
            id = "openrouter",
            name = "OpenRouter",
            description = "一站式访问多种模型",
            icon = Icons.Filled.Language,
            iconTint = Color(0xFF4FC3F7),
            defaultBaseUrl = "https://openrouter.ai/api/v1"
        ),
        AIProvider(
            id = "grok",
            name = "Grok",
            description = "Elon Musk 旗下 xAI 模型",
            icon = Icons.Filled.Close,
            iconTint = Color(0xFFE0E0E0)
        ),
        AIProvider(
            id = "nvidia",
            name = "Nvidia",
            description = "英伟达推理服务",
            icon = Icons.Filled.Memory,
            iconTint = Color(0xFF4CAF50)
        ),
        AIProvider(
            id = "siliconflow",
            name = "硅基流动",
            description = "高性能算力平台",
            icon = Icons.Filled.DeveloperBoard,
            iconTint = Color(0xFF2196F3),
            defaultBaseUrl = "https://api.siliconflow.cn/v1"
        ),
        AIProvider(
            id = "custom",
            name = "自定义",
            description = "配置自定义 OpenAI 兼容接口",
            icon = Icons.Filled.Settings,
            iconTint = Color(0xFF9E9E9E)
        )
    )

    fun getById(id: String): AIProvider? = providers.find { it.id == id }
}
