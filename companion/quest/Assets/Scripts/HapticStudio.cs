// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine;

namespace HapticStudio
{
    /// <summary>
    /// Haptic Clip, contains the haptic json as a string
    /// </summary>
    [System.Serializable]
    public class Clip
    {
        public string clipId;
        public string name;
        public string haptic;
        public string mime;
        public long lastUpdate;

        public static Dictionary<string, AudioType> SupportedAudioTypes = new()
        {
            {  "audio/wav", AudioType.WAV },
            {  "audio/x-wav", AudioType.WAV },
            {  "audio/ogg", AudioType.OGGVORBIS },
            {  "audio/mpeg", AudioType.MPEG },
            {  "audio/aiff", AudioType.AIFF },
            {  "audio/x-aiff", AudioType.AIFF }
        };

        public AudioType AudioFormat()
        {
            if (SupportedAudioTypes.Keys.Contains(mime))
            {
                return SupportedAudioTypes[mime];
            }
            return AudioType.UNKNOWN;
        }
    }

    /// <summary>
    /// Audio Data from a clip, contains the file returned by the socket in base64 representation
    /// </summary>
    [System.Serializable]
    public class AudioData
    {
        public string clipId;
        public string audio;
    }

    /// <summary>
    /// Audio Data from a clip, contains the file returned by the socket represented as a binary array
    /// </summary>
    [System.Serializable]
    public class AudioBinaryData
    {
        public string clipId;
        public byte[] audio;

        public static AudioBinaryData FromAudioData(AudioData audioData)
        {
            GroupCollection groups = Regex.Match(audioData.audio, @"^data:((?<type>[\w-\/]+))?;base64,(?<data>.+)$").Groups;
            string type = groups["type"].Value;
            string data = groups["data"].Value;
            if (Clip.SupportedAudioTypes.Keys.Contains(type))
            {
                byte[] binary = Convert.FromBase64String(data);
                AudioBinaryData binaryData = new();
                binaryData.audio = binary;
                binaryData.clipId = audioData.clipId;
                return binaryData;
            }
            return null;
        }
    }

    /// <summary>
    /// Group of haptic clips
    /// </summary>
    [System.Serializable]
    public class ClipGroup
    {
        public string id;
        public string name;
        public bool isFolder;
        public bool isCollapsed;
        public string[] clips;
    }

    /// <summary>
    /// Haptic Studio Project format
    /// </summary>
    [System.Serializable]
    public class Project
    {
        public string id;
        public string name;
        public string currentClipId;
        public Clip[] clips = new Clip[] { };
        public ClipGroup[] groups = new ClipGroup[] { };
        public bool isSample = false;
        public bool IsValid => !string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(name);

        public bool HasClip(string clipId)
        {
            return clips.Select(el => el.clipId).Contains(clipId);
        }
    }

    /// <summary>
    /// The standard response from a socket command
    /// </summary>
    [System.Serializable]
    public class SocketResponse
    {
        public string status;
    }

    /// <summary>
    /// The message with the current clip id
    /// </summary>
    [System.Serializable]
    public class CurrentClipMessage
    {
        public string currentClipId;
    }

    /// <summary>
    /// Haptic Studio Project format
    /// </summary>
    [System.Serializable]
    public class SampleProject
    {
        public Clip[] clips;
        public ClipGroup[] groups;
    }

    /// <summary>
    /// Pinned project
    /// </summary>
    [System.Serializable]
    public class PinnedProject
    {
        public string id;
        public string name;
        public string[] clipIds;
        public long lastUpdate;

        public PinnedProject(string id, string name, string[] clipIds, long lastUpdate)
        {
            this.id = id;
            this.name = name;
            this.clipIds = clipIds;
            this.lastUpdate = lastUpdate;
        }
    }
}
