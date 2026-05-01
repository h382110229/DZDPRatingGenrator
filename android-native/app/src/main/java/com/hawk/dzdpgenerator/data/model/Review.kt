package com.hawk.dzdpgenerator.data.model

enum class ReviewStyle(val key: String, val displayName: String, val promptHint: String = "") {
    WANGHONG("wanghong", "网红探店风", "活泼生动，多用emoji，像小红书博主一样分享体验"),
    ZHENGJING("zhengjing", "正经老饕风", "专业点评，关注食材、烹饪技法和口味层次"),
    TUCAO("tucao", "犀利吐槽风", "幽默犀利，有褒有贬，真实不做作"),
    JIANYUE("jianyue", "简约极简风", "简洁有力，重点突出，不废话"),
    PENGYOU("pengyou", "朋友推荐风", "像给朋友推荐一样自然亲切"),
    BOSHI("boshi", "美食博主风", "精致描述，注重出片和氛围感"),
    SHILIAN("shilian", "五星好评风", "积极正面，突出优点，适合好评"),
    GUSHI("gushi", "故事叙事风", "讲述用餐故事，有场景感和代入感"),
    TUIJIAN("tuijian", "必吃推荐风", "强调必吃理由，适合种草"),
    WENYI("wenyi", "文艺清新风", "文艺范儿，注重氛围和感受"),
    YOUMO("youmo", "幽默搞笑风", "轻松幽默，让人看了想笑");

    companion object {
        fun fromKey(key: String): ReviewStyle =
            entries.find { it.key == key } ?: WANGHONG
    }
}

data class GeneratedReview(
    val id: String = System.currentTimeMillis().toString(),
    val shopName: String,
    val reviewText: String,
    val timestamp: Long = System.currentTimeMillis()
)
