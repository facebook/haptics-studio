// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.IO;
using System.Net;
using UnityEngine;
using System.Linq;

namespace HapticStudio
{
    /// <summary>
    /// Utility library
    /// </summary>
    public class Utils : MonoBehaviour
    {
        public static string TEST_SAMPLE_DIRECTORY = "xrihe2etestdir";

        /// <summary>
        /// Get the time span between Now and a Unix time in natural language (e.g. "1 hour ago")
        /// </summary>
        /// <param name="unixTime">The Unix time in milliseconds</param>
        /// <returns></returns>
        public static string TimeAgo(long unixTime)
        {
            DateTime dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc).AddMilliseconds(unixTime).ToLocalTime();
            return TimeAgo(dateTime);
        }

        /// <summary>
        /// Get the time span between Now and a DateTime in natural language (e.g. "1 hour ago")
        /// </summary>
        /// <param name="dateTime">The time in the past</param>
        public static string TimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.Now.Subtract(dateTime);
            if (timeSpan <= TimeSpan.FromSeconds(5))
            {
                return "just now";
            }
            else if (timeSpan <= TimeSpan.FromSeconds(60))
            {
                return $"less than a minute ago";
            }
            else if (timeSpan <= TimeSpan.FromMinutes(60))
            {
                return timeSpan.Minutes > 1 ? $"about {timeSpan.Minutes} minutes ago" : "about a minute ago";
            }
            else if (timeSpan <= TimeSpan.FromHours(24))
            {
                return timeSpan.Hours > 1 ? $"about {timeSpan.Hours} hours ago" : "about an hour ago";
            }
            else if (timeSpan <= TimeSpan.FromDays(30))
            {
                return timeSpan.Days > 1 ? $"about {timeSpan.Days} days ago" : "yesterday";
            }
            else if (timeSpan <= TimeSpan.FromDays(365))
            {
                return timeSpan.Days > 30 ? $"about {timeSpan.Days / 30} months ago" : "about a month ago";
            }
            else
            {
                return timeSpan.Days > 365 ? $"about {timeSpan.Days / 365} years ago" : "about a year ago";
            }
        }

        /// <summary>
        /// Check if an IP address is in the valid format
        /// </summary>
        /// <param name="ipString">The string to evaluate</param>
        /// <returns>A boolean with the validity</returns>
        public static bool IsIPAddressValid(string ipString)
        {
            IPAddress.TryParse(ipString, out IPAddress result);
            return result != null;
        }

        /// <summary>
        /// Check if a port number is valid. Note that it excludes the reserved ports (between 1 and 1024)
        /// </summary>
        /// <param name="portString">The port number</param>
        /// <returns>A boolean with the validity</returns>
        public static bool IsPortValid(string portString)
        {
            return int.TryParse(portString, out int result) && result > 1024 && result < 65535;
        }

        /// <summary>
        /// Get the path to the project file
        /// </summary>
        /// <param name="id">The project Id</param>
        public static string PathForProject(string id)
        {
            return $"{Application.persistentDataPath}/{id}.hasp";
        }

        /// <summary>
        /// Get the path for clip storage
        /// </summary>
        /// <param name="clipId">The clip Id</param>
        public static string PathForClip(string clipId)
        {
            return $"{Application.persistentDataPath}/{clipId}/";
        }

        /// <summary>
        /// Get the path to the haptic pattern file
        /// </summary>
        /// <param name="clipId">The clip Id</param>
        public static string PathForHapticClip(string clipId)
        {
            return $"{PathForClip(clipId)}pattern.haptic";
        }

        /// <summary>
        /// Returns the audio path
        /// </summary>
        /// <param name="clipId">The clip id</param>
        /// <returns>The path to the audio clip</returns>
        public static string PathForAudioClip(string clipId)
        {
            return $"{PathForClip(clipId)}audio";
        }

        public static string[] StoredClips()
        {
            return Directory.GetDirectories($"{Application.persistentDataPath}/").Select((path) => new DirectoryInfo(path).Name).ToArray();
        }

        /// <summary>
        /// Prepare the directory and the file for storage
        /// </summary>
        /// <param name="path">The path to prepare</param>
        public static void CreateFile(string path)
        {
            var folder = Path.GetDirectoryName(path);
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }
            if (!File.Exists(path))
            {
                File.Create(path).Close();
            }
        }

        /// <summary>
        /// Remove a file from storage
        /// </summary>
        /// <param name="path">The path to the file</param>
        public static void DeleteFile(string path)
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }

        /// <summary>
        /// Remove a directory from storage
        /// </summary>
        /// <param name="path">The path to the directory</param>
        public static void DeleteDirectory(string path)
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }
    }
}
