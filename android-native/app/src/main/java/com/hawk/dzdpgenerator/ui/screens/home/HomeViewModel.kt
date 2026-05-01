package com.hawk.dzdpgenerator.ui.screens.home

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.net.Uri
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.location.LocationServices
import com.hawk.dzdpgenerator.data.model.ProviderConfig
import com.hawk.dzdpgenerator.data.model.ReviewStyle
import com.hawk.dzdpgenerator.data.remote.AmapPoi
import com.hawk.dzdpgenerator.data.remote.AmapTip
import com.hawk.dzdpgenerator.data.repository.AmapRepository
import com.hawk.dzdpgenerator.data.repository.LlmRepository
import com.hawk.dzdpgenerator.data.repository.ProviderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val selectedImages: List<Uri> = emptyList(),
    val shopName: String = "",
    val selectedStyle: ReviewStyle = ReviewStyle.WANGHONG,
    val wordCount: String = "200",
    val personalNote: String = "",
    val isGenerating: Boolean = false,
    val generatedResult: String? = null,
    val error: String? = null,
    val activeProviderName: String = "Hawk 内置 AI",
    val activeModel: String = "gemma-4-31b-it",
    // Amap search
    val showShopSearch: Boolean = false,
    val shopSearchResults: List<AmapTip> = emptyList(),
    val nearbyPois: List<AmapPoi> = emptyList(),
    val isSearchingShops: Boolean = false,

    val currentLongitude: Double? = null,
    val currentLatitude: Double? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val llmRepository: LlmRepository,
    private val providerRepository: ProviderRepository,
    private val amapRepository: AmapRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    private var searchJob: Job? = null

    init {
        loadActiveProvider()
        getCurrentLocation()
    }

    private fun loadActiveProvider() {
        viewModelScope.launch {
            val providerId = providerRepository.getActiveProviderId().first()
            val config = providerRepository.getProviderConfig(providerId).first()
            if (config != null) {
                _uiState.value = _uiState.value.copy(
                    activeProviderName = providerId,
                    activeModel = config.selectedModel
                )
            }
        }
    }

    private fun getCurrentLocation() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            return
        }
        
        val fusedClient = LocationServices.getFusedLocationProviderClient(context)
        try {
            fusedClient.lastLocation.addOnSuccessListener { location: Location? ->
                if (location != null) {
                    _uiState.value = _uiState.value.copy(
                        currentLongitude = location.longitude,
                        currentLatitude = location.latitude
                    )
                }
            }
        } catch (_: SecurityException) { }
    }

    fun fetchLocationAndOpenSearch() {
        _uiState.value = _uiState.value.copy(
            showShopSearch = true
        )
        
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            return
        }
        
        val fusedClient = LocationServices.getFusedLocationProviderClient(context)
        try {
            fusedClient.lastLocation.addOnSuccessListener { location: Location? ->
                if (location != null) {
                    _uiState.value = _uiState.value.copy(
                        currentLongitude = location.longitude,
                        currentLatitude = location.latitude
                    )
                    loadNearbyPois()
                } else {
                    requestFreshLocation(fusedClient)
                }
            }.addOnFailureListener { e ->
                // Location failed silently
            }
        } catch (e: SecurityException) {
            // SecurityException caught silently
        }
    }
    
    private fun requestFreshLocation(fusedClient: com.google.android.gms.location.FusedLocationProviderClient) {
        val request = com.google.android.gms.location.LocationRequest.Builder(
            com.google.android.gms.location.Priority.PRIORITY_BALANCED_POWER_ACCURACY, 5000L
        ).setMaxUpdates(1).build()
        
        val callback = object : com.google.android.gms.location.LocationCallback() {
            override fun onLocationResult(result: com.google.android.gms.location.LocationResult) {
                val location = result.lastLocation
                if (location != null) {
                    _uiState.value = _uiState.value.copy(
                        currentLongitude = location.longitude,
                        currentLatitude = location.latitude
                    )
                    loadNearbyPois()
                }
                fusedClient.removeLocationUpdates(this)
            }
        }
        
        try {
            fusedClient.requestLocationUpdates(request, callback, android.os.Looper.getMainLooper())
        } catch (_: SecurityException) { }
    }

    fun closeShopSearch() {
        _uiState.value = _uiState.value.copy(
            showShopSearch = false,
            shopSearchResults = emptyList()
        )
    }

    private fun loadNearbyPois() {
        val lon = _uiState.value.currentLongitude
        val lat = _uiState.value.currentLatitude
        if (lon == null || lat == null) {
            return
        }
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isSearchingShops = true
            )
            val result = amapRepository.searchAround(lon, lat)
            result.fold(
                onSuccess = { pois ->
                    _uiState.value = _uiState.value.copy(
                        nearbyPois = pois,
                        isSearchingShops = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isSearchingShops = false
                    )
                }
            )
        }
    }

    fun searchShops(query: String) {
        searchJob?.cancel()
        if (query.isBlank()) {
            _uiState.value = _uiState.value.copy(shopSearchResults = emptyList())
            return
        }
        
        searchJob = viewModelScope.launch {
            delay(400) // debounce
            _uiState.value = _uiState.value.copy(
                isSearchingShops = true
            )
            
            val lon = _uiState.value.currentLongitude
            val lat = _uiState.value.currentLatitude
            val location = if (lon != null && lat != null) "$lon,$lat" else ""
            
            try {
                val result = amapRepository.getTips(query, location)
                result.fold(
                    onSuccess = { tips ->
                        _uiState.value = _uiState.value.copy(
                            shopSearchResults = tips,
                            isSearchingShops = false
                        )
                    },
                    onFailure = { e ->
                        try {
                            val textResult = amapRepository.searchText(query)
                            textResult.fold(
                                onSuccess = { pois ->
                                    val tips = pois.map { poi ->
                                        AmapTip(id = poi.id, name = poi.name, address = poi.address, district = "", location = poi.location, typecode = null)
                                    }
                                    _uiState.value = _uiState.value.copy(
                                        shopSearchResults = tips,
                                        isSearchingShops = false
                                    )
                                },
                                onFailure = { e2 ->
                                    _uiState.value = _uiState.value.copy(
                                        isSearchingShops = false
                                    )
                                }
                            )
                        } catch (e2: Exception) {
                            _uiState.value = _uiState.value.copy(
                                isSearchingShops = false
                            )
                        }
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSearchingShops = false
                )
            }
        }
    }

    fun selectShop(name: String) {
        _uiState.value = _uiState.value.copy(
            shopName = name,
            showShopSearch = false,
            shopSearchResults = emptyList()
        )
    }

    fun addImages(uris: List<Uri>) {
        val current = _uiState.value.selectedImages
        val remaining = 9 - current.size
        val newImages = (current + uris).take(9)
        _uiState.value = _uiState.value.copy(selectedImages = newImages)
    }

    fun removeImage(index: Int) {
        val current = _uiState.value.selectedImages.toMutableList()
        current.removeAt(index)
        _uiState.value = _uiState.value.copy(selectedImages = current)
    }

    fun updateShopName(value: String) {
        _uiState.value = _uiState.value.copy(shopName = value)
    }

    fun updateStyle(style: ReviewStyle) {
        _uiState.value = _uiState.value.copy(selectedStyle = style)
    }

    fun updateWordCount(value: String) {
        _uiState.value = _uiState.value.copy(wordCount = value)
    }

    fun updatePersonalNote(value: String) {
        _uiState.value = _uiState.value.copy(personalNote = value)
    }

    fun generate() {
        val state = _uiState.value
        if (state.shopName.isBlank()) {
            _uiState.value = state.copy(error = "请输入店铺名称")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isGenerating = true, error = null, generatedResult = null)
            
            try {
                val providerId = providerRepository.getActiveProviderId().first()
                val config = providerRepository.getProviderConfig(providerId).first()
                
                val apiKey = config?.apiKey ?: ""
                val baseUrl = config?.baseUrl ?: com.hawk.dzdpgenerator.data.remote.Secrets.builtinBaseUrl
                val model = config?.selectedModel ?: "gemma-4-31b-it"
                
                val result = llmRepository.generateReview(
                    shopName = state.shopName,
                    style = state.selectedStyle,
                    wordCount = state.wordCount.toIntOrNull() ?: 200,
                    personalNote = state.personalNote,
                    imageUris = state.selectedImages,
                    providerId = providerId,
                    apiKey = apiKey,
                    baseUrl = baseUrl,
                    model = model
                )
                
                result.fold(
                    onSuccess = { text ->
                        _uiState.value = _uiState.value.copy(
                            isGenerating = false,
                            generatedResult = text
                        )
                    },
                    onFailure = { e ->
                        _uiState.value = _uiState.value.copy(
                            isGenerating = false,
                            error = e.message ?: "生成失败"
                        )
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isGenerating = false,
                    error = e.message ?: "未知错误"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearSearchResults() {
        _uiState.value = _uiState.value.copy(shopSearchResults = emptyList())
    }

    fun clearResult() {
        _uiState.value = _uiState.value.copy(generatedResult = null)
    }
}
