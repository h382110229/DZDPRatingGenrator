package com.hawk.dzdpgenerator.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.hawk.dzdpgenerator.data.model.ProviderConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "provider_config")

@Singleton
class ProviderRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val gson = Gson()
    private val ACTIVE_PROVIDER_KEY = stringPreferencesKey("active_provider")
    private val CONFIG_PREFIX = "config_"

    fun getActiveProviderId(): Flow<String> {
        return context.dataStore.data.map { prefs ->
            prefs[ACTIVE_PROVIDER_KEY] ?: "hawk_builtin"
        }
    }

    suspend fun setActiveProviderId(id: String) {
        context.dataStore.edit { prefs ->
            prefs[ACTIVE_PROVIDER_KEY] = id
        }
    }

    fun getProviderConfig(providerId: String): Flow<ProviderConfig?> {
        return context.dataStore.data.map { prefs ->
            val json = prefs[stringPreferencesKey(CONFIG_PREFIX + providerId)]
            if (json != null) gson.fromJson(json, ProviderConfig::class.java) else null
        }
    }

    suspend fun saveProviderConfig(config: ProviderConfig) {
        context.dataStore.edit { prefs ->
            prefs[stringPreferencesKey(CONFIG_PREFIX + config.providerId)] = gson.toJson(config)
        }
    }

    fun getAllConfigs(): Flow<Map<String, ProviderConfig>> {
        return context.dataStore.data.map { prefs ->
            prefs.asMap().entries
                .filter { it.key.name.startsWith(CONFIG_PREFIX) }
                .associate { (key, value) ->
                    key.name.removePrefix(CONFIG_PREFIX) to gson.fromJson(value as String, ProviderConfig::class.java)
                }
        }
    }
}
