package com.hawk.dzdpgenerator.data.remote

import com.google.gson.annotations.SerializedName
import retrofit2.http.GET
import retrofit2.http.Query

interface AmapService {
    @GET("v3/place/around")
    suspend fun searchAround(
        @Query("key") key: String,
        @Query("location") location: String,
        @Query("radius") radius: Int = 2000,
        @Query("types") types: String = "050000|060000|070000|080000|090000|100000",
        @Query("offset") offset: Int = 20
    ): AmapPoiResponse

    @GET("v3/place/text")
    suspend fun searchText(
        @Query("key") key: String,
        @Query("keywords") keywords: String,
        @Query("city") city: String = "",
        @Query("types") types: String = "050000|060000|070000|080000|090000|100000",
        @Query("offset") offset: Int = 20
    ): AmapPoiResponse

    @GET("v3/assistant/inputtips")
    suspend fun getTips(
        @Query("key") key: String,
        @Query("keywords") keywords: String,
        @Query("location") location: String = "",
        @Query("datatype") datatype: String = "poi"
    ): AmapTipsResponse
}

data class AmapPoiResponse(
    val status: String,
    val info: String?,
    val pois: List<AmapPoi>?
)

data class AmapPoi(
    val id: String,
    val name: String,
    val address: String?,
    val type: String?,
    val location: String?,
    @SerializedName("tel") val telRaw: com.google.gson.JsonElement?,  // Amap tel 可能是 string 或 array
    val distance: String?
) {
    val tel: String?
        get() = try {
            if (telRaw == null || telRaw.isJsonNull) null
            else if (telRaw.isJsonArray) {
                val arr = telRaw.asJsonArray
                if (arr.size() > 0) arr[0].asString else null
            } else telRaw.asString
        } catch (_: Exception) { null }
}

data class AmapTipsResponse(
    val status: String,
    val info: String?,
    val tips: List<AmapTip>?
)

data class AmapTip(
    val id: String?,
    val name: String,
    val address: String?,
    val district: String?,
    val location: String?,
    val typecode: String?
)
