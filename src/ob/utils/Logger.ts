/*
*  Logger utility for backend
*  Sends log commands to the frontend via WorkerCommunicator
*/

import { LogCommand, LogLevel } from "../commands/LogCommand";
import { IWorkerCommunicator } from "../../workers/IWorkerCommunicator";

export class Logger {
    private static communicator: IWorkerCommunicator | null = null;

    public static setCommunicator(communicator: IWorkerCommunicator): void {
        Logger.communicator = communicator;
    }

    private static sendLog(level: LogLevel, message: string, error?: Error, source?: string, context?: any): void {
        if (!Logger.communicator) {
            // Fallback to console if communicator not set
            const levelName = LogLevel[level] || 'INFO';
            if (level >= LogLevel.ERROR) {
                console.error(`[${levelName}] ${source ? `[${source}] ` : ''}${message}`, error, context);
            } else if (level >= LogLevel.WARN) {
                console.warn(`[${levelName}] ${source ? `[${source}] ` : ''}${message}`, context);
            } else {
                console.log(`[${levelName}] ${source ? `[${source}] ` : ''}${message}`, context);
            }
            return;
        }

        const stack = error?.stack;
        // Include context in message if provided
        let fullMessage = message;
        if (context) {
            fullMessage += ` | Context: ${JSON.stringify(context)}`;
        }
        const logCommand = new LogCommand(level, fullMessage, stack, source);
        Logger.communicator.sendCommand(logCommand);
    }

    public static debug(message: string, source?: string): void {
        Logger.sendLog(LogLevel.DEBUG, message, undefined, source);
    }

    public static info(message: string, source?: string): void {
        Logger.sendLog(LogLevel.INFO, message, undefined, source);
    }

    public static warn(message: string, source?: string): void {
        Logger.sendLog(LogLevel.WARN, message, undefined, source);
    }

    public static error(message: string, error?: Error, source?: string, context?: any): void {
        Logger.sendLog(LogLevel.ERROR, message, error, source, context);
    }

    public static fatal(message: string, error?: Error, source?: string, context?: any): void {
        Logger.sendLog(LogLevel.FATAL, message, error, source, context);
    }
}

