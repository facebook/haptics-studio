/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'fs';
import os from 'os';
import path from 'path';
import winston from 'winston';
import {isObject} from 'lodash';
import {description, build} from '../../../package.json';
import {PathManager} from '../services';
import Analytics, {ErrorType} from '../analytics';

const env = process.env.NODE_ENV || 'production';

const singletonEnforcer = Symbol('singletonEnforcer');

export interface LoggerConfig {
  prefix?: string;
  logLevel?: string;
  logsPath?: string;
  logFilename?: string;
  logMaxFilesize?: number;
  logMaxFiles?: number;
}

/**
 * Singleton class that handles tha application logger.
 * It logs both on output and files, with files rotation
 * */
export default class Logger {
  public static init(): Promise<Logger> {
    return Logger.instance.init();
  }

  public static log(level: string, message: any, ...meta: any): void {
    Logger.instance.getLogger().log({level, message, meta});
  }

  /**
   * Log an error to the console and also upload via the error reporter
   * @param error the Error instance
   */
  public static logError(error: Error): void {
    Analytics.instance.addErrorEvent({
      type: ErrorType.backend,
      error_name: error.name,
      message: error.message,
      stack_trace: error.stack ?? '',
    });
    Logger.instance.getLogger().error(error.message, error.stack);
  }

  public static error(message: any, ...meta: any): void {
    Logger.instance.getLogger().error(message, {meta});
  }

  public static warn(message: any, ...meta: any): void {
    Logger.instance.getLogger().warn(message, {meta});
  }

  public static info(message: any, ...meta: any): void {
    Logger.instance.getLogger().info(message, {meta});
  }

  public static verbose(message: any, ...meta: any): void {
    Logger.instance.getLogger().verbose(message, {meta});
  }

  public static debug(message: any, ...meta: any): void {
    Logger.instance.getLogger().debug(message, {meta});
  }

  public static silly(message: any, ...meta: any): void {
    Logger.instance.getLogger().silly(message, {meta});
  }

  public static logger(): winston.Logger {
    return Logger.instance.getLogger();
  }

  private static singleton: Logger;

  private prefix: string;

  private defaultLogger: winston.Logger | undefined;

  private defaultTransports: any[];

  private transports: any[];

  private logLevel: string;

  private logsPath: string;

  private logFilename: string;

  private logMaxFilesize: number;

  private logMaxFiles: number;

  /**
   * Represents an instance of the application Logger
   * @constructor
   * */
  constructor(enforcer: symbol) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }

    // Default log message prefix
    this.prefix = `${description} - `;
    // Default log level
    this.logLevel = env !== 'production' ? 'debug' : 'info';
    // Default directory where logs are stored (user data path)
    this.logsPath = path.join(PathManager.instance.getDataPath(), 'logs');
    // Default file name
    this.logFilename = `${build.productName}.log`;
    // Default max log file size 20 MB
    this.logMaxFilesize = 20971520; // size in bytes
    // Max number of rotated files
    this.logMaxFiles = 7;

    const rest = (info: any) => {
      return info.meta && info.meta.length > 0
        ? ` - ${info.meta.map((m: any) => JSON.stringify(m, undefined, 2)).join(os.EOL)}`
        : '';
    };

    // Add default console transport
    this.defaultTransports = [
      new winston.transports.Console({
        level: this.logLevel,
        format: winston.format.combine(
          // flowlint-line-ignore
          winston.format.colorize({all: true}),
          winston.format.printf(info => {
            return `[${info.pid}] ${info.timestamp} - ${info.level}: ${this.prefix}${info.message}${rest(info)}`;
          }),
        ),
      }),
    ];

    this.transports = this.defaultTransports;

    this.getLogger();
  }

  /**
   * Returns the current instance
   * @return { Logger } - Current logger instance
   * */
  static get instance(): Logger {
    if (!Logger.singleton) {
      Logger.singleton = new Logger(singletonEnforcer);
    }
    return Logger.singleton;
  }

  /**
   * Initializes logger transports
   * @return { Logger } - Current logger instance
   * */
  public init = async (configs: LoggerConfig = {}): Promise<Logger> => {
    const {
      prefix,
      logMaxFilesize,
      logMaxFiles,
      logFilename,
      logLevel,
      logsPath,
    } = configs;
    // Override logger configs
    this.prefix = prefix || this.prefix;
    this.logLevel = logLevel || this.logLevel;
    this.logsPath = logsPath || this.logsPath;
    this.logMaxFilesize = logMaxFilesize || this.logMaxFilesize;
    this.logMaxFiles = logMaxFiles || this.logMaxFiles;
    this.logFilename = logFilename || this.logFilename;

    const rest = (info: any) => {
      return info.meta && info.meta.length > 0
        ? ` - ${info.meta.map((m: any) => JSON.stringify(m, undefined, 2)).join(os.EOL)}`
        : '';
    };

    // Add file transport
    const loggerTransports = [...this.defaultTransports];
    const opts = {
      level: this.logLevel,
      filename: path.join(this.logsPath, this.logFilename),
      maxsize: this.logMaxFilesize,
      maxFiles: this.logMaxFiles,
      format: winston.format.printf(info => {
        const message = isObject(info.message)
          ? JSON.stringify(info.message)
          : info.message;
        return `[${info.pid}] ${info.timestamp} - ${info.level}: ${this.prefix}${message}${rest(info)}`;
      }),
    };
    loggerTransports.push(new winston.transports.File(opts));

    this.transports = loggerTransports;
    this.setLogLevel(this.logLevel);

    if (this.transports.includes('file')) {
      await this.initLogsFolders();
    }

    this.getLogger({update: true}).silly('logs folder initialized');
    return this;
  };

  /**
   * Returns the default winston logger, updating its transports
   * @return { winston.Logger } - Current winston logger instance
   * */
  public getLogger = (params?: {update?: boolean}): winston.Logger => {
    const {transports} = this;
    if (!this.defaultLogger || (params && params.update)) {
      this.defaultLogger = winston.createLogger({
        format: winston.format.combine(
          winston.format(info => {
            // eslint-disable-next-line no-param-reassign
            info.pid = process.pid;
            return info;
          })(),
          winston.format.timestamp(),
          winston.format.simple(),
        ),
        transports,
      });
      this.transports = transports;
    }
    return this.defaultLogger;
  };

  /**
   * Sets a log level for all transports
   * */
  public setLogLevel = (level: string): void => {
    for (let i = 0; i < this.transports.length; i += 1) {
      this.transports[i].level = level;
    }
  };

  /**
   * Sets a log message prefix
   * */
  public setPrefix = (prefix: string): void => {
    this.prefix = prefix;
  };

  /**
   * Creates logs folders
   * */
  private initLogsFolders = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(this.logsPath);
        this.getLogger().info(`Created logs folder: ${this.logsPath}`);
      } catch (e) {
        if ((e as Record<string, unknown>).code !== 'EEXIST') {
          // eslint-disable-next-line no-console
          console.error(`ERROR: error creating logs folder ${this.logsPath}`);
          reject(e);
        }
      }
      resolve();
    });
  };
}
