/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.example.hapticsstudio.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    primary = Accent,
    onPrimary = TextColor,
    background = Background,
    onBackground = TextColor,
    surface = LightBackground,
    onSurface = TextColor,
    surfaceVariant = LightBackground,
    onSurfaceVariant = TextColor,
)

@Composable
fun HapticsStudioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
  MaterialTheme(
      colorScheme = DarkColors,
      typography = Typography,
      content = content,
  )
}
