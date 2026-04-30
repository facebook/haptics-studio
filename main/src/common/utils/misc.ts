/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Miscellaneous utility functions
 */
import path from 'path';
import semver from 'semver';
import {app} from 'electron';
import {version} from '../../../../package.json';
import Logger from '../logger';
import Configs, {AppVersion, Config} from '../configs';

interface Migration {
  name: string;
  version: string;
  up: (configs: Config) => void;
  down: (configs: Config) => void;
}

/**
 * Get current time in seconds
 * @returns Current timestamp in seconds
 */
export function currentSeconds(): number {
  return Math.floor(new Date().getTime() / 1000);
}

/**
 * Check if developer messages are enabled
 * Developer messages could be forced settings the env variable DEVELOPER_MESSAGES to 'true'
 * @returns true if developer messages are enabled
 */
export function developerMessagesEnabled(): boolean {
  return process.env.DEVELOPER_MESSAGES === 'true';
}

/**
 * Get current high resolution time
 * @param unit - The unit of time ('milli', 'micro', 'nano')
 * @returns The current time in the specified unit
 */
export function now(unit: string): number {
  const hrTime = process.hrtime();
  switch (unit) {
    case 'milli':
      return hrTime[0] * 1000 + hrTime[1] / 1000000;
    case 'micro':
      return hrTime[0] * 1000000 + hrTime[1] / 1000;
    case 'nano':
    default:
      return hrTime[0] * 1000000000 + hrTime[1];
  }
}

/**
 * Generate random digits
 * @param length - Number of digits to generate
 * @returns String of random digits
 */
export function generateRandomDigits(length = 4): string {
  const start = 3;
  return Math.random()
    .toString()
    .substring(start, start + length);
}

/**
 * Get the release channel based on app version
 * @returns The release channel ('beta' or 'latest')
 */
export function getReleaseChannel(): string {
  const {app} = Configs.configs;
  if (app.version.includes('beta')) {
    return 'beta';
  }
  return 'latest';
}

/**
 * Get the application version
 * @returns The app version string
 */
export function getAppVersion(): string {
  if (process.env.NODE_ENV === 'development') {
    return version;
  }
  return app.getVersion();
}

/**
 * Check if app upgrade is needed
 * @param packagedVersion - The packaged version
 * @param version - The current version
 * @returns true if upgrade is needed
 */
export function isAppUpgradeNeeded(
  packagedVersion: string,
  version: string,
): boolean {
  let upgradeNeeded = false;
  try {
    upgradeNeeded =
      packagedVersion && version ? semver.gt(packagedVersion, version) : false;
  } catch (error) {
    Logger.error((error as Error).message);
  }
  return upgradeNeeded;
}

/**
 * Convert an object representation to a SemVer object
 * @param version the version object
 * @returns A valid SemVer object
 */
export function semVerFromObject(version: AppVersion): semver.SemVer {
  return new semver.SemVer(
    `${version.major ?? 1}.${version.minor ?? 0}.${version.patch ?? 0}`,
  );
}

/**
 * Check which migrations need to be executed based on the configuration file version
 * and the version contained in the migration file
 * If the migration needs to be executed it performs its "up" function
 */
export function executeMigrations(): void {
  const {version = '0.0.0'} = Configs.configs;

  // Dynamically load migration files from the migration folders and prepare the array to
  // check which migrations need to be executed
  const migrations: Migration[] = [];
  const requireMigrations = require.context('../../migrations', false, /\.ts$/);
  requireMigrations.keys().forEach((file: string) => {
    const name = file.split(path.sep).pop() || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const module: Migration = requireMigrations(file).default;
    const {up, down} = module;
    migrations.push({name, version: module.version, up, down});
  });

  // filter migrations based on the migration file version and the configuration file version
  // if the configuration file version is less than the migration file version, that migration
  // is added to the migrationsToExecute array
  let migrationsToExecute = migrations.filter(m => {
    const configFileVersion = semver.coerce(version);
    const migrationFileVersion = semver.coerce(m.version);
    return configFileVersion && migrationFileVersion
      ? semver.lt(configFileVersion, migrationFileVersion)
      : false;
  });

  // sort migrations by name
  migrationsToExecute = migrationsToExecute.sort((a, b) =>
    a.name > b.name ? 1 : -1,
  );

  if (migrationsToExecute.length > 0) {
    const lastVersion =
      migrationsToExecute[migrationsToExecute.length - 1].version;

    Logger.info(`Executing migrations from ${version} to ${lastVersion}`);
    // execute migrations in sequence
    let stopExecution = false;
    migrationsToExecute.forEach(migration => {
      if (stopExecution) {
        Logger.warn(`Skip migration ${migration.name}`);
      } else {
        try {
          Logger.info(`Executing migration ${migration.name}...`);
          migration.up(Configs.configs);
        } catch (e) {
          Logger.error(`Failed to execute migration ${migration.name}`);
          const err = e as Error;
          Logger.error(err.message, err.stack);
          stopExecution = true;
        }
      }
    });

    // Update the configs file version with the last migration version
    // This field is required to check at which version the configuration file has been migrated
    Configs.instance.set('version', lastVersion);

    Logger.info('Migrations completed');
  } else {
    Logger.info('No migrations to execute');
  }
}
