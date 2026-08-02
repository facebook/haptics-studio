/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.example.hapticsstudio.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hapticsstudio.model.Clip
import com.example.hapticsstudio.model.Project
import com.example.hapticsstudio.model.SocketEndpoint
import com.example.hapticsstudio.net.ProjectViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClipsScreen(
    endpoint: SocketEndpoint,
    onBack: () -> Unit,
    viewModel: ProjectViewModel = viewModel(),
) {
  DisposableEffect(endpoint.ip, endpoint.port) {
    viewModel.connect(endpoint)
    onDispose { viewModel.disconnect() }
  }

  val isConnecting by viewModel.isConnecting.collectAsState()
  val isConnected by viewModel.isConnected.collectAsState()
  val shouldAuthenticate by viewModel.shouldAuthenticate.collectAsState()
  val project by viewModel.project.collectAsState()
  val currentPlayingClipId by viewModel.currentPlayingClipId.collectAsState()

  Scaffold(
      containerColor = MaterialTheme.colorScheme.background,
      topBar = {
        TopAppBar(
            title = { Text(project?.name ?: endpoint.hostname) },
            navigationIcon = {
              IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                )
              }
            },
            colors =
                TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                    navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                ),
        )
      },
  ) { padding ->
    Box(
        modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
      val currentProject = project
      when {
        shouldAuthenticate -> AuthCodeEntry(onSubmit = { viewModel.sendAuthCode(it) })
        isConnecting -> ConnectingState()
        currentProject != null ->
            ClipList(
                project = currentProject,
                playingClipId = currentPlayingClipId,
                onClipClick = { viewModel.playClip(it.clipId) },
            )
        isConnected -> Text("Connected", color = MaterialTheme.colorScheme.onBackground)
        else -> ConnectingState()
      }
    }
  }
}

@Composable
private fun ConnectingState() {
  Column(horizontalAlignment = Alignment.CenterHorizontally) {
    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    Spacer(modifier = Modifier.height(16.dp))
    Text(
        text = "Connecting to Haptics Studio...",
        color = MaterialTheme.colorScheme.onBackground,
    )
  }
}

@Composable
private fun AuthCodeEntry(onSubmit: (String) -> Unit) {
  var code by remember { mutableStateOf("") }
  Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      modifier = Modifier.fillMaxWidth(),
  ) {
    Text(
        text = "To connect Studio Desktop enter the code displayed in the Desktop App",
        color = MaterialTheme.colorScheme.onBackground,
        textAlign = TextAlign.Center,
    )
    Spacer(modifier = Modifier.height(24.dp))
    OutlinedTextField(
        value = code,
        onValueChange = { code = it },
        singleLine = true,
        textStyle =
            MaterialTheme.typography.headlineLarge.copy(
                fontSize = 48.sp,
                textAlign = TextAlign.Center,
            ),
        placeholder = { Text("----") },
        keyboardOptions =
            androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = KeyboardType.NumberPassword,
            ),
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(modifier = Modifier.height(24.dp))
    Button(onClick = { onSubmit(code) }) { Text("Submit") }
  }
}

@Composable
private fun ClipList(
    project: Project,
    playingClipId: String?,
    onClipClick: (Clip) -> Unit,
) {
  if (project.clips.isEmpty()) {
    Text("No clips in this project", color = MaterialTheme.colorScheme.onBackground)
    return
  }
  LazyColumn(
      modifier = Modifier.fillMaxSize(),
      verticalArrangement = Arrangement.spacedBy(8.dp),
  ) {
    project.groups.forEach { group ->
      if (group.isFolder) {
        item(key = "group-${group.id}") {
          Text(
              text = group.name ?: "",
              style = MaterialTheme.typography.titleSmall,
              color = MaterialTheme.colorScheme.onBackground,
              modifier = Modifier.padding(top = 8.dp),
          )
        }
        val folderClips = group.clips.mapNotNull { project.clipById(it) }
        items(folderClips, key = { it.clipId }) { clip ->
          ClipRow(
              clip = clip,
              isPlaying = clip.clipId == playingClipId,
              onClick = { onClipClick(clip) },
          )
        }
      } else {
        val clip = group.clips.firstOrNull()?.let { project.clipById(it) }
        if (clip != null) {
          item(key = "clip-${clip.clipId}") {
            ClipRow(
                clip = clip,
                isPlaying = clip.clipId == playingClipId,
                onClick = { onClipClick(clip) },
            )
          }
        }
      }
    }
  }
}

@Composable
private fun ClipRow(clip: Clip, isPlaying: Boolean, onClick: () -> Unit) {
  Card(
      modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
  ) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
      Icon(
          imageVector = Icons.Filled.GraphicEq,
          contentDescription = null,
          tint =
              if (isPlaying) MaterialTheme.colorScheme.primary
              else MaterialTheme.colorScheme.onSurface,
      )
      Spacer(modifier = Modifier.width(12.dp))
      Text(text = clip.name, color = MaterialTheme.colorScheme.onSurface)
    }
  }
}
