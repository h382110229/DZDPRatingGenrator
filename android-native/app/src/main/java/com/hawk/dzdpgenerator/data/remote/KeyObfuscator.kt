package com.hawk.dzdpgenerator.data.remote

import android.util.Base64

/**
 * 密钥混淆工具 - 与原 RN 项目相同的方案：字符串反转 + Base64
 * 存储的是反转后的 Base64，解码时先 Base64 decode 再 reverse
 */
object KeyObfuscator {
    
    fun decode(obfuscated: String): String {
        val decoded = String(Base64.decode(obfuscated, Base64.DEFAULT))
        return decoded.reversed()
    }
    
    fun encode(plain: String): String {
        val reversed = plain.reversed()
        return Base64.encodeToString(reversed.toByteArray(), Base64.NO_WRAP)
    }
}
