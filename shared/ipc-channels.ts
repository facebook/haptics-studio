/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ---------------------------------------------------------------------------
// Renderer → Main  (request / response)
// ---------------------------------------------------------------------------

export const IpcInvokeChannel = {
  // App / globals
  TermsAndConditions: 'terms_and_conditions',
  RecentProjects: 'recent_projects',
  Samples: 'samples',
  ToggleDefaultControls: 'toggle_default_controls',
  ToggleMenuItems: 'toggle_menu_items',
  NewProject: 'new_project',

  // Analytics / telemetry
  FrontendAnalyticsMessage: 'frontend_analytics_message',
  FrontendErrorRaised: 'frontend_error_raised',
  TelemetryConsentState: 'telemetry_consent_state',
  TelemetrySaveConsentState: 'telemetry_save_consent_state',
  TelemetrySetConsentNotificationShown:
    'telemetry_set_consent_notification_shown',

  // Device
  DevicesStatusRequest: 'devices_status_request',
  DisconnectDevice: 'disconnect_device',
  WsAuthCodeRequest: 'ws_auth_code_request',
  ToggleDevicePanel: 'toggle_device_panel',
  StopAdvertising: 'stop_advertising',

  // Menu
  ToggleEmphasis: 'toggle_emphasis',
  ToggleCopy: 'toggle_copy',
  Copy: 'copy',

  // Updater
  DownloadUpdate: 'download_update',
  QuitAndInstall: 'quit_and_install',

  // Files
  AddFiles: 'add_files',
  FileSelected: 'file_selected',
  OpenProject: 'open_project',

  // Project
  Open: 'open',
  LoadCurrentProject: 'load_current_project',
  CloseCurrentProject: 'close_current_project',
  RenameProject: 'rename_project',
  UpdateMetadata: 'update_metadata',
  UpdateGroups: 'update_groups',

  // Clips – CRUD
  SetCurrentClip: 'set_current_clip',
  UpdateClipName: 'update_clip_name',
  UpdateNotes: 'update_notes',
  UpdateMarkers: 'update_markers',
  UpdateTrim: 'update_trim',
  UpdatePlayhead: 'update_playhead',
  DuplicateClips: 'duplicate_clips',
  DeleteClips: 'delete_clips',

  // Clips – audio / haptic
  HapticUpdate: 'haptic_update',
  RelocateAsset: 'relocate_asset',
  AddAudioToClip: 'add_audio_to_clip',
  ExternalAuditioning: 'external_auditioning',

  // Clips – export
  ExportClips: 'export_clips',
  RawExportPreview: 'raw_export_preview',

  // WebSocket
  SetPlayhead: 'set_playhead',
} as const;

export type IpcInvokeChannelName =
  (typeof IpcInvokeChannel)[keyof typeof IpcInvokeChannel];

// ---------------------------------------------------------------------------
// Renderer → Main  (fire-and-forget)
// ---------------------------------------------------------------------------

export const IpcSendChannel = {
  QuitApplication: 'quit_application',
  OpenExportFolder: 'open_export_folder',
  OpenSystemFolderAt: 'open_system_folder_at',
  Paste: 'paste',
  LoadProjectSuccess: 'load_project_success',

  // Clips – analysis / import
  AudioAnalysis: 'audio_analysis',
  UpdateAudioAnalysis: 'update_audio_analysis',
  ImportHaptics: 'import_haptics',
  SplitStereoClip: 'split_stereo_clip',
  CreateEmptyClip: 'create_empty_clip',
  RetryAudioAnalysis: 'retry_audio_analysis',
} as const;

export type IpcSendChannelName =
  (typeof IpcSendChannel)[keyof typeof IpcSendChannel];

// ---------------------------------------------------------------------------
// Main → Renderer  (events pushed from main process)
// ---------------------------------------------------------------------------

export const MainToRenderer = {
  // App lifecycle
  Error: 'error',
  Close: 'close',
  WindowInfo: 'window_info',

  // Project
  ProjectInfo: 'project_info',
  Open: 'open',
  SaveAs: 'save_as',
  MissingAudioFile: 'missing_audio_file',

  // Clips
  SetCurrentClip: 'set_current_clip',
  AudioAnalysis: 'audio_analysis',
  UpdateAudioAnalysis: 'update_audio_analysis',
  CurrentAnalysis: 'current_analysis',
  ImportHaptics: 'import_haptics',
  AddFiles: 'add_files',
  ExportClipsResponse: 'export_clips_response',
  OpenHaptic: 'open_haptic',

  // Edit operations (from menu accelerators)
  SelectAll: 'select_all',
  Undo: 'undo',
  Redo: 'redo',
  Emphasis: 'emphasis',
  Copy: 'copy',
  Cut: 'cut',
  Paste: 'paste',
  PasteInPlace: 'paste_in_place',
  PasteEmphasisInPlace: 'paste_emphasis_in_place',
  Group: 'group',
  Ungroup: 'ungroup',

  // From ExportButton listeners
  ExportAllClips: 'export_all_clips',
  ExportClips: 'export_clips',
  DuplicateClips: 'duplicate_clips',

  // Device / WS
  WsAuthCode: 'ws_auth_code',
  DevicesStatus: 'devices_status',
  DeviceAuthRequest: 'device_auth_request',

  // Legal & telemetry
  TermsAndConditions: 'terms_and_conditions',
  TelemetryConsentState: 'telemetry_consent_state',
  TelemetryConsentSettings: 'telemetry_consent_settings',

  // Updater
  UpdateAvailable: 'update_available',
  UpdateDownloaded: 'update_downloaded',
  DownloadProgress: 'download_progress',
  UpdateError: 'update_error',

  // Tutorial navigator
  DocumentationNext: 'documentation_next',
  DocumentationBack: 'documentation_back',
  DocumentationFinish: 'documentation_finish',

  // Android export preview
  RawExportPreview: 'raw_export_preview',
} as const;

export type MainToRendererChannelName =
  (typeof MainToRenderer)[keyof typeof MainToRenderer];
