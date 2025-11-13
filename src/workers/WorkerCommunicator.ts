/*
*  Worker Communicator
*  Replaces com.mignari.workers.WorkerCommunicator
*  For Node.js, this will use Worker Threads or EventEmitter
*/

import { EventEmitter } from "events";
import { IWorkerCommunicator } from "./IWorkerCommunicator";
import { WorkerCommand } from "./WorkerCommand";
import { LogCommand, LogLevel } from "../ob/commands/LogCommand";

export class WorkerCommunicator extends EventEmitter implements IWorkerCommunicator {
    private _callbacks: Map<any, (...args: any[]) => void | Promise<any>> = new Map();
    private _registeredClasses: Set<any> = new Set();

    public registerClass(clazz: any): void {
        this._registeredClasses.add(clazz);
    }

    public registerCallback(commandClass: any, callback: (...args: any[]) => void | Promise<any>): void {
        this._callbacks.set(commandClass, callback);
    }

    public sendCommand(command: WorkerCommand): void {
        // In a real implementation, this would send to the main thread
        // For now, we'll emit an event
        this.emit("command", command);
    }

    public start(): void {
        // Start listening for commands
        // In a real implementation, this would set up message passing
    }

    public handleCommand(command: WorkerCommand): void {
        console.log(`[WorkerCommunicator] handleCommand called for: ${command.constructor.name}`);
        
        // Handle LogCommand specially - just forward it, never process it
        if (command instanceof LogCommand) {
            this.sendCommand(command);
            return;
        }

        const callback = this._callbacks.get(command.constructor);
        console.log(`[WorkerCommunicator] Callback lookup: command.constructor=${command.constructor.name}, found=${!!callback}, total callbacks=${this._callbacks.size}`);
        
        if (!callback) {
            // Log unknown command, but don't create LogCommand for LogCommand itself (prevents loops)
            if (command.constructor.name === 'LogCommand') {
                console.warn('[WorkerCommunicator] LogCommand should not be processed by handleCommand');
                return;
            }
            
            // Log unknown command
            const logCommand = new LogCommand(
                LogLevel.WARN,
                `No callback registered for command: ${command.constructor.name}`,
                undefined,
                'WorkerCommunicator'
            );
            this.sendCommand(logCommand);
            console.error(`[WorkerCommunicator] No callback found for ${command.constructor.name}. Registered callbacks:`, Array.from(this._callbacks.keys()).map((c: any) => c.name));
            return;
        }

        // Extract command properties and call callback
        const args = this.extractCommandArgs(command);
        console.log(`[WorkerCommunicator] Calling callback with ${args.length} args:`, args);
        try {
            const result = callback(...args);
            // Handle async callbacks (promises)
            if (result && typeof result === "object" && typeof result.then === "function") {
                result.catch((error: any) => {
                    const errorMsg = `Error in async callback for ${command.constructor.name}: ${error.message || error}`;
                    const logCommand = new LogCommand(
                        LogLevel.ERROR,
                        errorMsg,
                        error.stack,
                        'WorkerCommunicator'
                    );
                    this.sendCommand(logCommand);
                    console.error("Error in async callback:", error);
                });
            }
        } catch (error: any) {
            const errorMsg = `Error in callback for ${command.constructor.name}: ${error.message || error}`;
            const logCommand = new LogCommand(
                LogLevel.ERROR,
                errorMsg,
                error.stack,
                'WorkerCommunicator'
            );
            this.sendCommand(logCommand);
            console.error("Error in callback:", error);
        }
    }

    private extractCommandArgs(command: WorkerCommand): any[] {
        // Extract all properties from the command object
        const args: any[] = [];
        for (const key in command) {
            if (command.hasOwnProperty(key) && key !== "data") {
                args.push((command as any)[key]);
            }
        }
        return args;
    }
}

