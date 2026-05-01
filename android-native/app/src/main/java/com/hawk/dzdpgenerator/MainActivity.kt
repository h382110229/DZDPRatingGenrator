package com.hawk.dzdpgenerator

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.hawk.dzdpgenerator.navigation.MainNavGraph
import com.hawk.dzdpgenerator.ui.theme.HawkTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HawkTheme {
                MainNavGraph()
            }
        }
    }
}
