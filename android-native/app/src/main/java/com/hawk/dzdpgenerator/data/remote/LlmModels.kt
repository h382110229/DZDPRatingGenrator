package com.hawk.dzdpgenerator.data.remote

import com.google.gson.annotations.SerializedName

// OpenAI-compatible Chat Completions request
data class ChatRequest(
    val model: String,
    val messages: List<ChatMessage>,
    val temperature: Double = 0.85,
    val max_tokens: Int? = null
)

data class ChatMessage(
    val role: String,  // "system", "user", "assistant"
    val content: Any   // String or List<ContentPart>
)

// For multimodal (text + images)
data class ContentPart(
    val type: String,       // "text" or "image_url"
    val text: String? = null,
    @SerializedName("image_url")
    val imageUrl: ImageUrl? = null
)

data class ImageUrl(
    val url: String  // "data:image/jpeg;base64,..."
)

// Response
data class ChatResponse(
    val id: String?,
    val choices: List<Choice>?,
    val error: ErrorBody?
)

data class Choice(
    val index: Int,
    val message: ChatMessage?,
    @SerializedName("finish_reason")
    val finishReason: String?
)

data class ErrorBody(
    val message: String,
    val type: String?
)
