package com.hawk.dzdpgenerator.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.hawk.dzdpgenerator.ui.screens.home.HomeScreen
import com.hawk.dzdpgenerator.ui.screens.provider.ProviderDetailScreen
import com.hawk.dzdpgenerator.ui.screens.settings.SettingsScreen
import com.hawk.dzdpgenerator.ui.theme.HawkColors

object Routes {
    const val HOME = "home"
    const val HISTORY = "history"
    const val SETTINGS = "settings"
    const val PROVIDER_DETAIL = "provider_detail/{providerId}"

    fun providerDetail(providerId: String) = "provider_detail/$providerId"
}

sealed class BottomNavItem(
    val route: String,
    val label: String,
    val icon: @Composable () -> Unit
) {
    data object Generator : BottomNavItem(
        route = Routes.HOME,
        label = "评论生成",
        icon = { Icon(Icons.Filled.EditNote, contentDescription = "评论生成") }
    )
    data object History : BottomNavItem(
        route = Routes.HISTORY,
        label = "评论历史",
        icon = { Icon(Icons.Filled.History, contentDescription = "评论历史") }
    )
    data object Settings : BottomNavItem(
        route = Routes.SETTINGS,
        label = "设置",
        icon = { Icon(Icons.Filled.Settings, contentDescription = "设置") }
    )
}

val bottomNavItems = listOf(
    BottomNavItem.Generator,
    BottomNavItem.History,
    BottomNavItem.Settings
)

@Composable
fun MainNavGraph() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Bottom bar is hidden on sub-pages
    val showBottomBar = currentRoute in listOf(Routes.HOME, Routes.HISTORY, Routes.SETTINGS)

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                BottomNavBar(
                    currentRoute = currentRoute ?: Routes.HOME,
                    onNavigate = { route ->
                        if (route != currentRoute) {
                            navController.navigate(route) {
                                popUpTo(Routes.HOME) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        },
        containerColor = HawkColors.Background
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    onNavigateToSettings = {
                        navController.navigate(Routes.SETTINGS)
                    }
                )
            }

            composable(Routes.HISTORY) {
                // TODO: implement history screen
                PlaceholderScreen("评论历史")
            }

            composable(Routes.SETTINGS) {
                SettingsScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToProviderDetail = { providerId ->
                        navController.navigate(Routes.providerDetail(providerId))
                    }
                )
            }

            composable(
                route = Routes.PROVIDER_DETAIL,
                arguments = listOf(
                    navArgument("providerId") { type = NavType.StringType }
                )
            ) { backStackEntry ->
                val providerId = backStackEntry.arguments?.getString("providerId") ?: ""
                ProviderDetailScreen(
                    providerId = providerId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
private fun BottomNavBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(HawkColors.Background)
            .padding(top = 1.dp, bottom = 0.dp)
            .windowInsetsPadding(WindowInsets.navigationBars)
            .height(64.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        bottomNavItems.forEach { item ->
            val isSelected = currentRoute == item.route
            val tintColor = if (isSelected) Color(0xFFFFB300) else Color.Gray

            Column(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigate(item.route) }
                    .padding(vertical = 4.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = when (item) {
                        is BottomNavItem.Generator -> Icons.Filled.EditNote
                        is BottomNavItem.History -> Icons.Filled.History
                        is BottomNavItem.Settings -> Icons.Filled.Settings
                    },
                    contentDescription = item.label,
                    tint = tintColor
                )
                Text(
                    item.label,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = tintColor,
                    letterSpacing = 0.5.sp
                )
            }
        }
    }
}

@Composable
private fun PlaceholderScreen(title: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(HawkColors.Background),
        contentAlignment = Alignment.Center
    ) {
        Text(
            "$title - 待实现",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge
        )
    }
}
