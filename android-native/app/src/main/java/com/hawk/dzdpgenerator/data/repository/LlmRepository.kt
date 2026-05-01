package com.hawk.dzdpgenerator.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import com.hawk.dzdpgenerator.data.model.ProviderRegistry
import com.hawk.dzdpgenerator.data.model.ReviewStyle
import com.hawk.dzdpgenerator.data.remote.ApiService
import com.hawk.dzdpgenerator.data.remote.Secrets
import com.hawk.dzdpgenerator.data.remote.ChatMessage
import com.hawk.dzdpgenerator.data.remote.ChatRequest
import com.hawk.dzdpgenerator.data.remote.ContentPart
import com.hawk.dzdpgenerator.data.remote.ImageUrl
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LlmRepository @Inject constructor(
    private val apiService: ApiService,
    private val providerRepository: ProviderRepository,
    @ApplicationContext private val context: Context
) {
    suspend fun generateReview(
        shopName: String,
        style: ReviewStyle,
        wordCount: Int,
        personalNote: String,
        imageUris: List<Uri>,
        providerId: String,
        apiKey: String,
        baseUrl: String,
        model: String
    ): Result<String> {
        return try {
            val messages = buildMessages(shopName, style, wordCount, personalNote, imageUris)
            val url = "${baseUrl.trimEnd('/')}/chat/completions"
            
            // Determine auth header - hawk-ai-proxy uses X-Hawk-Token
            val isHawkProxy = baseUrl.contains("hawk-ai-proxy")
            val effectiveKey = if (isHawkProxy && apiKey.isBlank()) Secrets.builtinToken else apiKey
            val auth = if (isHawkProxy) {
                effectiveKey
            } else {
                "Bearer $effectiveKey"
            }
            
            val request = ChatRequest(
                model = model,
                messages = messages,
                temperature = 0.85,
                max_tokens = 2048
            )
            
            val response = if (isHawkProxy) {
                apiService.chatCompletionsHawk(url, effectiveKey, request = request)
            } else {
                apiService.chatCompletions(url, "Bearer $effectiveKey", request)
            }
            
            if (response.error != null) {
                Result.failure(Exception(response.error.message))
            } else {
                val rawContent = response.choices?.firstOrNull()?.message?.content
                if (rawContent is String) {
                    // 过滤 Gemma 4 等模型的 <thought> 思考标签
                    val content = rawContent
                        .replace(Regex("<thought>[\\s\\S]*?</thought>"), "")
                        .trim()
                    if (content.isNotEmpty()) {
                        Result.success(content)
                    } else {
                        Result.failure(Exception("Empty response after stripping thought tags"))
                    }
                } else {
                    Result.failure(Exception("Empty response"))
                }
            }
        } catch (e: retrofit2.HttpException) {
            val errorBody = e.response()?.errorBody()?.string()
            val errorMsg = try {
                val json = com.google.gson.JsonParser.parseString(errorBody).asJsonObject
                json.get("message")?.asString ?: json.get("error")?.asString ?: "HTTP ${e.code()}"
            } catch (_: Exception) {
                "HTTP ${e.code()}: ${errorBody?.take(200)}"
            }
            Result.failure(Exception(errorMsg))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun buildMessages(
        shopName: String,
        style: ReviewStyle,
        wordCount: Int,
        personalNote: String,
        imageUris: List<Uri>
    ): List<ChatMessage> {
        val systemMsg = ChatMessage(
            role = "system",
            content = "你是一个资深的大众点评V8用户，擅长写真实自然的店铺评价。你的评价风格多样，能根据不同要求写出有温度、有细节的点评。"
        )

        val promptBuilder = StringBuilder()
        promptBuilder.appendLine("请为以下店铺写一篇大众点评评价：")
        promptBuilder.appendLine()
        promptBuilder.appendLine("🏪 店铺名称：$shopName")
        promptBuilder.appendLine("✍️ 评价风格：${style.displayName}")
        if (style.promptHint.isNotBlank()) {
            promptBuilder.appendLine("💡 风格提示：${style.promptHint}")
        }
        promptBuilder.appendLine("📏 字数要求：约${wordCount}字")
        if (personalNote.isNotBlank()) {
            promptBuilder.appendLine("💭 个人感受：$personalNote")
        }
        promptBuilder.appendLine()
        promptBuilder.appendLine("要求：")
        promptBuilder.appendLine("1. 语言自然真实，不要有AI感")
        promptBuilder.appendLine("2. 适当使用emoji增加生动感")
        promptBuilder.appendLine("3. 段落分明，阅读体验好")
        promptBuilder.appendLine("4. 包含具体的细节描写")

        val userContent: Any = if (imageUris.isNotEmpty()) {
            val parts = mutableListOf(ContentPart(type = "text", text = promptBuilder.toString()))
            for (uri in imageUris) {
                val base64 = uriToBase64(uri)
                if (base64 != null) {
                    parts.add(ContentPart(
                        type = "image_url",
                        imageUrl = ImageUrl(url = "data:image/jpeg;base64,$base64")
                    ))
                }
            }
            parts
        } else {
            promptBuilder.toString()
        }

        return listOf(systemMsg, ChatMessage(role = "user", content = userContent))
    }

    private fun uriToBase64(uri: Uri): String? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()
            
            // Resize to max 800px width
            val maxW = 800
            val scaled = if (bitmap.width > maxW) {
                val ratio = maxW.toFloat() / bitmap.width
                Bitmap.createScaledBitmap(bitmap, maxW, (bitmap.height * ratio).toInt(), true)
            } else bitmap
            
            val baos = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 70, baos)
            Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) {
            null
        }
    }
}
