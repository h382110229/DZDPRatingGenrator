package com.hawk.dzdpgenerator.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hawk.dzdpgenerator.data.model.AIProvider
import com.hawk.dzdpgenerator.data.model.ProviderRegistry
import com.hawk.dzdpgenerator.ui.theme.HawkColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToProviderDetail: (String) -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val providers = ProviderRegistry.providers
    val builtIn = providers.filter { it.isBuiltIn }
    val thirdParty = providers.filter { !it.isBuiltIn }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "AI 模型设置",
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Current Active
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "当前活跃",
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Gray
                )
                Spacer(modifier = Modifier.height(8.dp))
                ActiveProviderCard(
                    providerName = uiState.activeProviderId,
                    model = "已配置",
                    onClick = { onNavigateToProviderDetail(uiState.activeProviderId) }
                )
            }

            // Built-in
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "内置服务",
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Gray
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(builtIn) { provider ->
                ProviderRow(
                    provider = provider,
                    isActive = provider.id == uiState.activeProviderId,
                    isConfigured = uiState.configuredProviders.contains(provider.id),
                    onClick = {
                        viewModel.setActiveProvider(provider.id)
                        if (provider.hasConfig) onNavigateToProviderDetail(provider.id)
                    }
                )
            }

            // Third Party
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "第三方服务",
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Gray
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(thirdParty) { provider ->
                ProviderRow(
                    provider = provider,
                    isActive = provider.id == uiState.activeProviderId,
                    isConfigured = uiState.configuredProviders.contains(provider.id),
                    onClick = {
                        viewModel.setActiveProvider(provider.id)
                        if (provider.hasConfig) onNavigateToProviderDetail(provider.id)
                    }
                )
            }
        }
    }
}

@Composable
private fun ActiveProviderCard(
    providerName: String,
    model: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(HawkColors.SurfaceContainerHigh)
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Color(0xFFFFB300).copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text("🦅", fontSize = 20.sp)
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                providerName,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = HawkColors.OnSurface
            )
            Text(
                model,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        Icon(
            Icons.Filled.ChevronRight,
            contentDescription = null,
            tint = Color.Gray
        )
    }
}

@Composable
private fun ProviderRow(
    provider: AIProvider,
    isActive: Boolean,
    isConfigured: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .then(
                if (isActive) Modifier.background(Color(0xFFFFB300).copy(alpha = 0.08f))
                else Modifier.background(HawkColors.SurfaceContainerHigh)
            )
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(provider.iconTint.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = provider.icon,
                contentDescription = null,
                tint = provider.iconTint,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                provider.name,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = HawkColors.OnSurface
            )
            Text(
                provider.description,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        if (isActive) {
            Icon(
                Icons.Filled.Check,
                contentDescription = "已选择",
                tint = Color(0xFFFFB300),
                modifier = Modifier.size(20.dp)
            )
        } else if (isConfigured) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF4CAF50))
            )
        }
    }
}
