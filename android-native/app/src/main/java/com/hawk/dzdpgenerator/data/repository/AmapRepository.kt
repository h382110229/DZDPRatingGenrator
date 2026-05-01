package com.hawk.dzdpgenerator.data.repository

import com.hawk.dzdpgenerator.data.remote.AmapPoi
import com.hawk.dzdpgenerator.data.remote.AmapService
import com.hawk.dzdpgenerator.data.remote.Secrets
import com.hawk.dzdpgenerator.data.remote.AmapTip
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AmapRepository @Inject constructor(
    private val amapService: AmapService
) {
    companion object {
        val AMAP_KEY: String by lazy { Secrets.amapKey }
    }

    suspend fun searchAround(longitude: Double, latitude: Double): Result<List<AmapPoi>> {
        return try {
            val location = "$longitude,$latitude"
            val response = amapService.searchAround(key = AMAP_KEY, location = location)
            if (response.status == "1") {
                Result.success(response.pois ?: emptyList())
            } else {
                Result.failure(Exception(response.info ?: "搜索失败"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchText(keywords: String, city: String = ""): Result<List<AmapPoi>> {
        return try {
            val response = amapService.searchText(key = AMAP_KEY, keywords = keywords, city = city)
            if (response.status == "1") {
                Result.success(response.pois ?: emptyList())
            } else {
                Result.failure(Exception(response.info ?: "搜索失败"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTips(keywords: String, location: String = ""): Result<List<AmapTip>> {
        return try {
            val response = amapService.getTips(key = AMAP_KEY, keywords = keywords, location = location)
            if (response.status == "1") {
                Result.success(response.tips ?: emptyList())
            } else {
                Result.failure(Exception(response.info ?: "搜索失败"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
