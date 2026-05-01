package com.hawk.dzdpgenerator.ui.screens.home

import android.Manifest
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Surface
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.hawk.dzdpgenerator.data.model.GeneratedReview
import com.hawk.dzdpgenerator.data.model.ReviewStyle
import com.hawk.dzdpgenerator.ui.theme.HawkColors
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val clipboardManager = LocalClipboardManager.current

    // Location permission launcher
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Always open search sheet - GPS is optional, user can type to search
        viewModel.fetchLocationAndOpenSearch()
    }

    // Photo picker launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(9)
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            viewModel.addImages(uris)
        }
    }

    // Show errors
    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    val history = remember {
        mutableListOf(
            GeneratedReview(
                shopName = "小龙坎老火锅",
                reviewText = "不得不说，这家小龙坎真的是排队王者👑！周末拉着朋友来吃，锅底醇厚红亮，牛油味一绝。毛肚七上八下脆爽弹牙，酥肉炸得外焦里嫩，直接吃或者下锅煮都超级棒。服务员添汤很及时，环境也是古色古香的。强烈推荐给爱吃辣的朋友们！🌶️🔥"
            ),
            GeneratedReview(
                shopName = "% Arabica",
                reviewText = "极简风的装修真的非常出片📸。点了一杯经典的西班牙拿铁，拉花很精致，口感丝滑，炼乳的甜味和咖啡的醇香融合得恰到好处，不会觉得腻。虽然价格略高，但坐在窗边看着街景发呆，度过一个悠闲的下午也是值得的。☕️✨"
            )
        )
    }

    // Shop search bottom sheet
    if (uiState.showShopSearch) {
        ModalBottomSheet(
            onDismissRequest = { viewModel.closeShopSearch() },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = HawkColors.SurfaceContainerHigh
        ) {
            ShopSearchSheet(
                uiState = uiState,
                onSearch = { viewModel.searchShops(it) },
                onSelect = { viewModel.selectShop(it) },
                onClose = { viewModel.closeShopSearch() }
            )
        }
    }

    Scaffold(
        snackbarHost = {
            SnackbarHost(snackbarHostState) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = Color(0xFFD32F2F),
                    contentColor = Color.White
                )
            }
        },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "大众点评评价生成器",
                        color = Color(0xFFFFB300),
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { }) {
                        Icon(
                            Icons.Filled.AutoAwesome,
                            contentDescription = null,
                            tint = Color(0xFFFFB300)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            Icons.Filled.Settings,
                            contentDescription = "设置",
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
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Image Upload Section
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "上传图片（最高9张）",
                    style = MaterialTheme.typography.titleMedium,
                    color = HawkColors.OnSurface
                )
                Spacer(modifier = Modifier.height(12.dp))
                ImageGrid(
                    images = uiState.selectedImages,
                    onAddImage = {
                        photoPickerLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    onRemoveImage = { index -> viewModel.removeImage(index) }
                )
            }

            // Shop Name - with Amap autocomplete
            item {
                SurfaceCard {
                    Text(
                        "商店名称",
                        style = MaterialTheme.typography.titleMedium,
                        color = HawkColors.OnSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = uiState.shopName,
                        onValueChange = {
                            viewModel.updateShopName(it)
                            viewModel.searchShops(it)
                        },
                        placeholder = { Text("输入商铺名称搜索", color = Color.Gray) },
                        trailingIcon = {
                            IconButton(onClick = {
                                viewModel.clearSearchResults()
                                locationPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }) {
                                Icon(
                                    Icons.Filled.LocationOn,
                                    contentDescription = "搜索附近商铺",
                                    tint = Color(0xFFFFB300)
                                )
                            }
                        },
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

            // Autocomplete results - as a separate item outside SurfaceCard

            if (uiState.shopSearchResults.isNotEmpty()) {
                items(uiState.shopSearchResults.take(6)) { tip ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 2.dp)
                            .clickable {
                                viewModel.selectShop(tip.name)
                            },
                        shape = RoundedCornerShape(8.dp),
                        color = HawkColors.SurfaceContainerHigh
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                tip.name,
                                style = MaterialTheme.typography.bodyLarge,
                                color = HawkColors.OnSurface,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            val subtitle = listOfNotNull(
                                tip.address?.takeIf { it.isNotBlank() },
                                tip.district?.takeIf { it.isNotBlank() }
                            ).joinToString(" · ")
                            if (subtitle.isNotBlank()) {
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    subtitle,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.Gray,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }

            // Style + Settings Row
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    SurfaceCard {
                        var expandedStyle by remember { mutableStateOf(false) }
                        Text(
                            "点评风格",
                            style = MaterialTheme.typography.titleMedium,
                            color = HawkColors.OnSurface
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Box {
                            OutlinedTextField(
                                value = uiState.selectedStyle.displayName,
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = {
                                    Icon(Icons.Filled.ExpandMore, contentDescription = null, tint = Color.Gray)
                                },
                                modifier = Modifier.fillMaxWidth().clickable { expandedStyle = true },
                                shape = RoundedCornerShape(8.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFFFFB300),
                                    unfocusedBorderColor = HawkColors.OutlineVariant,
                                    focusedTextColor = HawkColors.OnSurface,
                                    unfocusedTextColor = HawkColors.OnSurface,
                                    disabledTextColor = HawkColors.OnSurface
                                )
                            )
                            DropdownMenu(
                                expanded = expandedStyle,
                                onDismissRequest = { expandedStyle = false },
                                modifier = Modifier.fillMaxWidth().background(HawkColors.SurfaceContainerHigh)
                            ) {
                                ReviewStyle.entries.forEach { style ->
                                    DropdownMenuItem(
                                        text = { Text(style.displayName, color = HawkColors.OnSurface) },
                                        onClick = { viewModel.updateStyle(style); expandedStyle = false }
                                    )
                                }
                            }
                            Box(modifier = Modifier.matchParentSize().clickable { expandedStyle = true })
                        }
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        SurfaceCard(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("字数建议", style = MaterialTheme.typography.titleMedium, color = HawkColors.OnSurface)
                                Icon(Icons.Filled.EditNote, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(20.dp))
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = uiState.wordCount,
                                onValueChange = { viewModel.updateWordCount(it.filter { c -> c.isDigit() }) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
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

                        SurfaceCard(
                            modifier = Modifier.weight(1f).clickable { onNavigateToSettings() },
                            border = BorderStroke(1.dp, HawkColors.OutlineVariant.copy(alpha = 0.5f))
                        ) {
                            Text("使用模型", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    uiState.activeModel,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = HawkColors.OnSurface,
                                    maxLines = 1, overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Box(
                                    modifier = Modifier.size(36.dp).clip(CircleShape).background(HawkColors.Background)
                                        .border(1.dp, Color(0xFFFFB300).copy(alpha = 0.3f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Filled.AutoFixHigh, contentDescription = null, tint = Color(0xFFFFB300), modifier = Modifier.size(20.dp))
                                }
                            }
                        }
                    }
                }
            }

            // Personal Note
            item {
                SurfaceCard(
                    modifier = Modifier.fillMaxWidth(),
                    brush = Brush.linearGradient(colors = listOf(Color(0xFFFFB300).copy(alpha = 0.05f), Color.Transparent))
                ) {
                    Text("简单感受 （选填）", style = MaterialTheme.typography.titleMedium, color = HawkColors.OnSurface)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = uiState.personalNote,
                        onValueChange = { viewModel.updatePersonalNote(it) },
                        placeholder = { Text("有什么特别想夸或吐槽的？", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth().height(100.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFFFFB300),
                            unfocusedBorderColor = HawkColors.OutlineVariant,
                            cursorColor = Color(0xFFFFB300),
                            focusedTextColor = HawkColors.OnSurface,
                            unfocusedTextColor = HawkColors.OnSurface
                        ),
                        maxLines = 3
                    )
                }
            }

            // Generate Button
            item {
                Button(
                    onClick = { viewModel.generate() },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFB300), contentColor = HawkColors.OnSecondary),
                    enabled = !uiState.isGenerating
                ) {
                    if (uiState.isGenerating) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.Black, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("生成中...")
                    } else {
                        Text("一键生成点评", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("🦅", fontSize = 24.sp)
                    }
                }
            }

            // Generated Result
            if (uiState.generatedResult != null) {
                item {
                    SurfaceCard(border = BorderStroke(1.dp, Color(0xFFFFB300).copy(alpha = 0.3f))) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("✨ 生成结果", style = MaterialTheme.typography.titleMedium, color = Color(0xFFFFB300))
                            TextButton(onClick = { clipboardManager.setText(AnnotatedString(uiState.generatedResult!!)) }) {
                                Icon(Icons.Filled.ContentCopy, contentDescription = null, tint = Color(0xFFFFB300), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("复制", color = Color(0xFFFFB300))
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(uiState.generatedResult!!, style = MaterialTheme.typography.bodyMedium, color = HawkColors.OnSurface)
                    }
                }
            }

            // History Section
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.History, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("生成记录", style = MaterialTheme.typography.titleMedium, color = HawkColors.OnSurface)
                }
                Spacer(modifier = Modifier.height(4.dp))
            }

            items(history) { review ->
                HistoryCard(review = review, onCopy = { clipboardManager.setText(AnnotatedString(review.reviewText)) })
            }

            item { Spacer(modifier = Modifier.height(100.dp)) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShopSearchSheet(
    uiState: HomeUiState,
    onSearch: (String) -> Unit,
    onSelect: (String) -> Unit,
    onClose: () -> Unit
) {
    var searchText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(bottom = 32.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("搜索商铺", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = HawkColors.OnSurface)
            IconButton(onClick = onClose) {
                Icon(Icons.Filled.Close, contentDescription = "关闭", tint = Color.Gray)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Search field
        OutlinedTextField(
            value = searchText,
            onValueChange = { 
                searchText = it
                onSearch(it)
            },
            placeholder = { Text("输入商铺名称搜索", color = Color.Gray) },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = Color.Gray) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFFFB300),
                unfocusedBorderColor = HawkColors.OutlineVariant,
                cursorColor = Color(0xFFFFB300),
                focusedTextColor = HawkColors.OnSurface,
                unfocusedTextColor = HawkColors.OnSurface
            ),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (uiState.isSearchingShops) {
            Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFFFFB300))
            }
        } else {
            // Results
            val results = if (searchText.isBlank()) {
                // Show nearby POIs
                uiState.nearbyPois.map { poi ->
                    Triple(poi.name, poi.address ?: "", poi.name)
                }
            } else {
                // Show search results
                uiState.shopSearchResults.map { tip ->
                    Triple(tip.name, tip.address ?: tip.district ?: "", tip.name)
                }
            }

            if (results.isEmpty() && searchText.isNotBlank()) {
                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                    Text("未找到相关商铺", color = Color.Gray)
                }
            } else {
                if (searchText.isBlank() && results.isNotEmpty()) {
                    Text("附近商铺", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                    Spacer(modifier = Modifier.height(8.dp))
                }

                LazyColumn(
                    modifier = Modifier.height(400.dp),
                    verticalArrangement = Arrangement.spacedBy(0.dp)
                ) {
                    items(results) { (name, address, selectName) ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(selectName) }
                                .padding(vertical = 12.dp)
                        ) {
                            Text(name, style = MaterialTheme.typography.bodyLarge, color = HawkColors.OnSurface)
                            if (address.isNotBlank()) {
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(address, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                            }
                        }
                        if (results.indexOf(Triple(name, address, selectName)) < results.size - 1) {
                            HorizontalDivider(color = HawkColors.OutlineVariant.copy(alpha = 0.3f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SurfaceCard(
    modifier: Modifier = Modifier,
    border: BorderStroke? = null,
    brush: Brush? = null,
    content: @Composable () -> Unit
) {
    val shape = RoundedCornerShape(16.dp)
    Box(
        modifier = modifier.fillMaxWidth()
            .then(if (brush != null) Modifier.background(brush, shape) else Modifier.background(HawkColors.SurfaceContainerHigh, shape))
            .then(if (border != null) Modifier.border(border, shape) else Modifier)
            .padding(16.dp)
    ) { Column { content() } }
}

@Composable
private fun ImageGrid(images: List<Uri>, onAddImage: () -> Unit, onRemoveImage: (Int) -> Unit) {
    val maxPerRow = 3
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        var index = 0
        while (index < images.size) {
            val rowEnd = minOf(index + maxPerRow, images.size)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                for (i in index until rowEnd) {
                    ImageItem(uri = images[i], onRemove = { onRemoveImage(i) }, modifier = Modifier.weight(1f).aspectRatio(1f))
                }
                repeat(maxPerRow - (rowEnd - index)) { Spacer(modifier = Modifier.weight(1f).aspectRatio(1f)) }
            }
            index = rowEnd
        }
        if (images.size < 9) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                AddImageButton(onClick = onAddImage, modifier = Modifier.weight(1f).aspectRatio(1f))
                repeat(maxPerRow - 1) { Spacer(modifier = Modifier.weight(1f).aspectRatio(1f)) }
            }
        }
    }
}

@Composable
private fun ImageItem(uri: Uri, onRemove: () -> Unit, modifier: Modifier = Modifier) {
    Box(modifier = modifier.clip(RoundedCornerShape(8.dp)).background(HawkColors.SurfaceContainerHigh)) {
        AsyncImage(model = uri, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(
            modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).size(24.dp).clip(CircleShape)
                .background(Color.Black.copy(alpha = 0.6f)).clickable(onClick = onRemove),
            contentAlignment = Alignment.Center
        ) { Icon(Icons.Filled.Close, contentDescription = "删除", tint = Color.White, modifier = Modifier.size(16.dp)) }
    }
}

@Composable
private fun AddImageButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.clip(RoundedCornerShape(8.dp)).background(HawkColors.SurfaceContainerHigh)
            .border(BorderStroke(1.dp, HawkColors.OutlineVariant), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Filled.Add, contentDescription = "添加图片", tint = Color.Gray, modifier = Modifier.size(32.dp))
            Text("添加图片", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
        }
    }
}

@Composable
private fun HistoryCard(review: GeneratedReview, onCopy: () -> Unit) {
    val dateFormat = remember { SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()) }
    SurfaceCard(border = BorderStroke(1.dp, Color.Transparent)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.History, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(review.shopName, style = MaterialTheme.typography.labelMedium, color = Color.Gray)
            }
            Text(dateFormat.format(Date(review.timestamp)), style = MaterialTheme.typography.labelMedium, color = Color.Gray)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(review.reviewText, style = MaterialTheme.typography.bodyMedium, color = Color(0xFFCCCCCC), maxLines = 3, overflow = TextOverflow.Ellipsis)
        Spacer(modifier = Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).clickable(onClick = onCopy).padding(horizontal = 12.dp, vertical = 6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.ContentCopy, contentDescription = null, tint = Color(0xFFFFB300), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("复制全文", style = MaterialTheme.typography.labelMedium, color = Color(0xFFFFB300))
                }
            }
        }
    }
}
