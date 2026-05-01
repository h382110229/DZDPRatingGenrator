package com.hawk.dzdpgenerator.ui.screens.provider

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hawk.dzdpgenerator.data.model.ProviderConfig
import com.hawk.dzdpgenerator.data.model.ProviderRegistry
import com.hawk.dzdpgenerator.ui.screens.settings.SettingsViewModel
import com.hawk.dzdpgenerator.ui.theme.HawkColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProviderDetailScreen(
    providerId: String,
    onNavigateBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val provider = ProviderRegistry.providers.find { it.id == providerId }
    val snackbarHostState = remember { SnackbarHostState() }

    var apiKey by remember { mutableStateOf("") }
    var baseUrl by remember { mutableStateOf("") }
    var selectedModel by remember { mutableStateOf("") }
    var showApiKey by remember { mutableStateOf(false) }
    var isLoaded by remember { mutableStateOf(false) }

    // Load existing config
    LaunchedEffect(providerId) {
        viewModel.getProviderConfig(providerId) { config ->
            if (config != null) {
                apiKey = config.apiKey
                baseUrl = config.baseUrl
                selectedModel = config.selectedModel
            } else {
                baseUrl = provider?.defaultBaseUrl ?: ""
                selectedModel = provider?.defaultModels?.firstOrNull() ?: ""
            }
            isLoaded = true
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        provider?.name ?: providerId,
                        color = Color(0xFFFFB300),
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "返回",
                            tint = Color.Gray
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = HawkColors.Background
                )
            )
        },
        containerColor = HawkColors.Background
    ) { paddingValues ->
        if (!isLoaded) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Color(0xFFFFB300))
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    // Provider header
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(HawkColors.SurfaceContainerHigh)
                            .padding(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background((provider?.iconTint ?: Color.Gray).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            provider?.icon?.let {
                                Icon(
                                    imageVector = it,
                                    contentDescription = null,
                                    tint = provider.iconTint,
                                    modifier = Modifier.size(26.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                provider?.name ?: providerId,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = HawkColors.OnSurface
                            )
                            Text(
                                provider?.description ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }

                item {
                    // API Key
                    Column {
                        Text(
                            "API Key",
                            style = MaterialTheme.typography.titleMedium,
                            color = HawkColors.OnSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = apiKey,
                            onValueChange = { apiKey = it },
                            placeholder = { Text("输入 API Key", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            visualTransformation = if (showApiKey) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { showApiKey = !showApiKey }) {
                                    Icon(
                                        if (showApiKey) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                        contentDescription = null,
                                        tint = Color.Gray
                                    )
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFFFFB300),
                                unfocusedBorderColor = HawkColors.OutlineVariant,
                                cursorColor = Color(0xFFFFB300),
                                focusedTextColor = HawkColors.OnSurface,
                                unfocusedTextColor = HawkColors.OnSurface
                            ),
                            singleLine = true
                        )
                    }
                }

                item {
                    // Base URL
                    Column {
                        Text(
                            "Base URL",
                            style = MaterialTheme.typography.titleMedium,
                            color = HawkColors.OnSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = baseUrl,
                            onValueChange = { baseUrl = it },
                            placeholder = { Text("https://api.example.com/v1", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFFFFB300),
                                unfocusedBorderColor = HawkColors.OutlineVariant,
                                cursorColor = Color(0xFFFFB300),
                                focusedTextColor = HawkColors.OnSurface,
                                unfocusedTextColor = HawkColors.OnSurface
                            ),
                            singleLine = true
                        )
                    }
                }

                item {
                    // Model
                    Column {
                        Text(
                            "模型",
                            style = MaterialTheme.typography.titleMedium,
                            color = HawkColors.OnSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = selectedModel,
                            onValueChange = { selectedModel = it },
                            placeholder = { Text("输入模型名称", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFFFFB300),
                                unfocusedBorderColor = HawkColors.OutlineVariant,
                                cursorColor = Color(0xFFFFB300),
                                focusedTextColor = HawkColors.OnSurface,
                                unfocusedTextColor = HawkColors.OnSurface
                            ),
                            singleLine = true
                        )
                        // Show default models as hints
                        if (provider?.defaultModels?.isNotEmpty() == true) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "推荐模型：${provider.defaultModels.joinToString(", ")}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            val config = ProviderConfig(
                                providerId = providerId,
                                apiKey = apiKey,
                                baseUrl = baseUrl,
                                selectedModel = selectedModel
                            )
                            viewModel.saveProviderConfig(config)
                            viewModel.setActiveProvider(providerId)
                            onNavigateBack()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFFFB300),
                            contentColor = Color.Black
                        )
                    ) {
                        Text(
                            "保存并激活",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }
    }
}
