/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.example.hapticsstudio.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.hapticsstudio.model.SocketEndpoint
import java.net.URLDecoder

@Composable
fun AppNavHost() {
  val navController = rememberNavController()

  NavHost(navController = navController, startDestination = "discovery") {
    composable("discovery") {
      DiscoveryScreen(
          onConnect = { endpoint ->
            val host = URLEncode(endpoint.hostname)
            navController.navigate("clips/${endpoint.ip}/${endpoint.port}/$host")
          },
      )
    }
    composable(
        route = "clips/{ip}/{port}/{hostname}",
        arguments =
            listOf(
                navArgument("ip") { type = NavType.StringType },
                navArgument("port") { type = NavType.IntType },
                navArgument("hostname") { type = NavType.StringType },
            ),
    ) { backStackEntry ->
      val ip = backStackEntry.arguments?.getString("ip") ?: ""
      val port = backStackEntry.arguments?.getInt("port") ?: 9999
      val hostname =
          URLDecoder.decode(
              backStackEntry.arguments?.getString("hostname") ?: ip,
              "UTF-8",
          )
      ClipsScreen(
          endpoint = SocketEndpoint(hostname = hostname, ip = ip, port = port),
          onBack = { navController.popBackStack() },
      )
    }
  }
}

private fun URLEncode(value: String): String = java.net.URLEncoder.encode(value, "UTF-8")
