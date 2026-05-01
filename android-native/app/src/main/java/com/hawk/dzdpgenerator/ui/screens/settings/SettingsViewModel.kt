package com.hawk.dzdpgenerator.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hawk.dzdpgenerator.data.model.ProviderConfig
import com.hawk.dzdpgenerator.data.repository.ProviderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val activeProviderId: String = "hawk_builtin",
    val configuredProviders: Set<String> = emptySet()
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val providerRepository: ProviderRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            val activeId = providerRepository.getActiveProviderId().first()
            val allConfigs = providerRepository.getAllConfigs().first()
            _uiState.value = SettingsUiState(
                activeProviderId = activeId,
                configuredProviders = allConfigs.keys
            )
        }
    }

    fun setActiveProvider(id: String) {
        viewModelScope.launch {
            providerRepository.setActiveProviderId(id)
            _uiState.value = _uiState.value.copy(activeProviderId = id)
        }
    }

    fun saveProviderConfig(config: ProviderConfig) {
        viewModelScope.launch {
            providerRepository.saveProviderConfig(config)
            loadData() // refresh
        }
    }

    fun getProviderConfig(providerId: String, onResult: (ProviderConfig?) -> Unit) {
        viewModelScope.launch {
            val config = providerRepository.getProviderConfig(providerId).first()
            onResult(config)
        }
    }
}
