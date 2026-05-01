package com.hawk.dzdpgenerator.data.remote

/**
 * 混淆存储的密钥 - 与原 RN 项目相同的混淆方案
 * 每个值 = 原始字符串反转后 Base64 编码
 */
object Secrets {
    // Hawk 内置 Proxy URL (与原 RN 项目混淆值一致)
    private const val OBF_BUILTIN_URL = "MXYvZW5pbG5vLm5lcmt3YWgueXhvcnAtaWEta3dhaC8vOnNwdHRo"
    // Hawk 内置 Proxy Token (与原 RN 项目混淆值一致)
    private const val OBF_BUILTIN_TOKEN = "N1JwTm0zUWRrOXpYeF82MjAyX2t3YWg="
    // 高德地图 Web Service Key (与原 RN 项目混淆值一致)
    private const val OBF_AMAP_KEY = "YmI1OGM2ODEwYzZmOTRjMjAxMjZiNjQ2MDgxZjBkYjQ=" 

    val builtinBaseUrl: String by lazy { KeyObfuscator.decode(OBF_BUILTIN_URL) }
    val builtinToken: String by lazy { KeyObfuscator.decode(OBF_BUILTIN_TOKEN) }
    val amapKey: String by lazy { KeyObfuscator.decode(OBF_AMAP_KEY) }
}
