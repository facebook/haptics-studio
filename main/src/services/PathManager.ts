/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * PathManager - Centralized path resolution for the application
 *
 * Handles all path-related logic including:
 * - Resource paths (development vs production)
 * - Application paths (asar vs unpacked)
 * - User data paths
 * - Asset and sample paths
 */

import path from 'path';
import fs from 'fs';
import {app} from 'electron';

const env = process.env.NODE_ENV || 'development';

/**
 * Singleton class for managing application paths
 */
export default class PathManager {
  private static singleton: PathManager;

  private resourcesPath: string | undefined;
  private dataPath: string | undefined;
  private applicationPath: string | undefined;
  private distPath: string | undefined;
  private publicPath: string | undefined;
  private assetsPath: string | undefined;
  private samplesPath: string | undefined;
  private binPath: string | undefined;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Returns the singleton instance
   */
  static get instance(): PathManager {
    if (!PathManager.singleton) {
      PathManager.singleton = new PathManager();
    }
    return PathManager.singleton;
  }

  /**
   * @return { string } - Path to the resources directory
   */
  public getResourcesPath = (): string => {
    if (!this.resourcesPath) {
      this.resourcesPath = process.resourcesPath;
      if (env === 'development') {
        this.resourcesPath = path.join(process.cwd(), 'main');
      }
    }
    return this.resourcesPath;
  };

  /**
   * Returns the path where user data are stored (logs, configs..)
   * @return { string } - Data path
   */
  public getDataPath = (): string => {
    if (!this.dataPath) {
      if (env === 'development') {
        this.dataPath = this.getResourcesPath();
      } else {
        this.dataPath = app.getPath('userData');
      }
    }
    return this.dataPath;
  };

  /**
   * Returns the path of the Application folder
   * @return { string } - Application folder
   */
  public getApplicationPath = (): string => {
    if (!this.applicationPath) {
      if (env === 'development') {
        this.applicationPath = this.getResourcesPath();
      } else {
        this.applicationPath = path.join(this.getResourcesPath(), 'app.asar');
        try {
          fs.accessSync(
            path.join(this.applicationPath, 'package.json'),
            fs.constants.F_OK,
          );
          // application packaged into an asar file
        } catch {
          this.applicationPath = path.join(this.getResourcesPath(), 'app');
          // application packaged NOT into an asar file
        }
      }
    }
    return this.applicationPath;
  };

  /**
   * Returns the path of the Electron application folder
   * @return { string } - Electron Application folder
   */
  public getDistPath = (): string => {
    if (!this.distPath) {
      if (env === 'development') {
        this.distPath = this.getApplicationPath();
      } else {
        this.distPath = path.join(this.getApplicationPath(), 'dist');
      }
    }
    return this.distPath;
  };

  /**
   * Returns the path of the Public folder
   * @return { string | undefined } - Public folder
   */
  public getPublicPath = (): string | undefined => {
    if (!this.publicPath) {
      if (env === 'development') {
        this.publicPath = undefined;
      } else {
        this.publicPath = path.join(this.getApplicationPath(), 'public');
      }
    }
    return this.publicPath;
  };

  /**
   * Returns the path of the Assets folder
   * @return { string } - Assets folder
   */
  public getAssetsPath = (): string => {
    if (!this.assetsPath) {
      if (env === 'development') {
        this.assetsPath = path.join(__dirname, '..', 'assets');
      } else {
        this.assetsPath = path.join(this.getDistPath(), 'assets');
      }
    }
    return this.assetsPath;
  };

  /**
   * Returns the path of the Samples folder
   * @return { string } - Samples folder
   */
  public getSamplesPath = (): string => {
    if (!this.samplesPath) {
      if (env === 'development') {
        this.samplesPath = path.join(__dirname, '..', 'samples');
      } else {
        this.samplesPath = path.join(this.getResourcesPath(), 'samples');
      }
    }
    return this.samplesPath;
  };

  /**
   * @returns the bin path
   */
  public getBinPath = (): string => {
    if (!this.binPath) {
      if (env === 'development' || env === 'test') {
        this.binPath = path.join(__dirname, '..', '..', 'bin');
      } else {
        this.binPath = path.join(this.getResourcesPath(), 'bin');
      }
    }
    return this.binPath;
  };

  /**
   * @returns the user home path
   */
  public getHomePath = (): string => {
    return app.getPath('home');
  };

  /**
   * Sets the path to specific application folders
   */
  public setPath = (pathType: string, dirPath: string): void => {
    if (app) {
      app.setPath(pathType, dirPath);
    }
  };

  /**
   * Reset all cached paths (useful for testing)
   */
  public resetPaths = (): void => {
    this.resourcesPath = undefined;
    this.dataPath = undefined;
    this.applicationPath = undefined;
    this.distPath = undefined;
    this.publicPath = undefined;
    this.assetsPath = undefined;
    this.samplesPath = undefined;
    this.binPath = undefined;
  };
}
