// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Linq;
using UnityEngine;

namespace HapticStudio
{
    /// <summary>
    /// Stores all parameters required to connect to an Haptic Studio socket
    /// </summary>
    [System.Serializable]
    public class SocketEndpoint
    {
        public string ip;
        public string port = "9999";
        public string hostname;

        private static readonly string[] keys = { "ENDPOINT_IP", "ENDPOINT_PORT", "ENDPOINT_HOSTNAME" };

        /// <summary>
        /// Saves the current endpoint in the PlayerPrefs
        /// </summary>
        public void StoreInPrefs()
        {
            PlayerPrefs.SetString("ENDPOINT_IP", ip);
            PlayerPrefs.SetString("ENDPOINT_PORT", port);
            PlayerPrefs.SetString("ENDPOINT_HOSTNAME", hostname);
        }

        /// <summary>
        /// Load an endpoint from the PlayerPrefs if available. Returns null if no endpoints are available
        /// </summary>
        public static SocketEndpoint LoadFromPrefs()
        {
            var hasKeys = keys.Select(k => PlayerPrefs.HasKey(k)).Aggregate(true, (acc, k) => acc && k);

            if (hasKeys)
            {
                SocketEndpoint endpoint = new()
                {
                    ip = PlayerPrefs.GetString("ENDPOINT_IP"),
                    port = PlayerPrefs.GetString("ENDPOINT_PORT"),
                    hostname = PlayerPrefs.GetString("ENDPOINT_HOSTNAME")
                };
                return endpoint;
            }
            return null;
        }

        /// <summary>
        /// Removes a previous endpoint from the PlayerPrefs
        /// </summary>
        public static void ClearPrefs()
        {
            foreach (string key in keys)
            {
                PlayerPrefs.DeleteKey(key);
            }
        }
    }
}
