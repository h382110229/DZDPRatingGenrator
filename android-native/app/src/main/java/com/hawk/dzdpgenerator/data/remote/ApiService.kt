package com.hawk.dzdpgenerator.data.remote

import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Url

interface ApiService {
    @POST
    suspend fun chatCompletions(
        @Url url: String,
        @Header("Authorization") auth: String,
        @Body request: ChatRequest
    ): ChatResponse

    @POST
    suspend fun chatCompletionsHawk(
        @Url url: String,
        @Header("X-Hawk-Token") hawkToken: String,
        @Header("Content-Type") contentType: String = "application/json",
        @Body request: ChatRequest
    ): ChatResponse
}
