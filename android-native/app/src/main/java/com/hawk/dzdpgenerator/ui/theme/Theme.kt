package com.hawk.dzdpgenerator.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val HawkDarkColorScheme = darkColorScheme(
    background = HawkColors.Background,
    surface = HawkColors.Surface,
    surfaceVariant = HawkColors.SurfaceVariant,
    surfaceContainerLowest = HawkColors.SurfaceContainerLowest,
    surfaceContainerLow = HawkColors.SurfaceContainerLow,
    surfaceContainer = HawkColors.SurfaceContainer,
    surfaceContainerHigh = HawkColors.SurfaceContainerHigh,
    surfaceContainerHighest = HawkColors.SurfaceContainerHighest,
    surfaceBright = HawkColors.SurfaceBright,
    surfaceDim = HawkColors.SurfaceDim,
    surfaceTint = HawkColors.SurfaceTint,
    primary = HawkColors.Primary,
    onPrimary = HawkColors.OnPrimary,
    primaryContainer = HawkColors.PrimaryContainer,
    onPrimaryContainer = HawkColors.OnPrimaryContainer,
    inversePrimary = HawkColors.InversePrimary,
    secondary = HawkColors.Secondary,
    onSecondary = HawkColors.OnSecondary,
    secondaryContainer = HawkColors.SecondaryContainer,
    onSecondaryContainer = HawkColors.OnSecondaryContainer,
    tertiary = HawkColors.Tertiary,
    onTertiary = HawkColors.OnTertiary,
    tertiaryContainer = HawkColors.TertiaryContainer,
    onTertiaryContainer = HawkColors.OnTertiaryContainer,
    onSurface = HawkColors.OnSurface,
    onSurfaceVariant = HawkColors.OnSurfaceVariant,
    onBackground = HawkColors.OnBackground,
    outline = HawkColors.Outline,
    outlineVariant = HawkColors.OutlineVariant,
    error = HawkColors.Error,
    onError = HawkColors.OnError,
    errorContainer = HawkColors.ErrorContainer,
    onErrorContainer = HawkColors.OnErrorContainer,
    inverseSurface = HawkColors.InverseSurface,
    inverseOnSurface = HawkColors.InverseOnSurface,
)

@Composable
fun HawkTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = HawkDarkColorScheme,
        typography = HawkTypography,
        content = content
    )
}
