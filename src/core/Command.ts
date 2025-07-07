/**
 * 命令接口
 */
export interface ICommand {
    /**
     * 执行命令
     */
    execute(): void;

    /**
     * 检查是否可以执行
     */
    canExecute(): boolean;

    /**
     * 撤销命令（可选）
     */
    undo?(): void;

    /**
     * 重做命令（可选）
     */
    redo?(): void;
}

/**
 * 命令基础实现
 */
export class Command implements ICommand {
    private _execute: () => void;
    private _canExecute: () => boolean;
    private _undo?: () => void;
    private _redo?: () => void;

    constructor(
        execute: () => void,
        canExecute?: () => boolean,
        undo?: () => void,
        redo?: () => void
    ) {
        this._execute = execute;
        this._canExecute = canExecute || (() => true);
        this._undo = undo;
        this._redo = redo;
    }

    /**
     * 执行命令
     */
    public execute(): void {
        if (this.canExecute()) {
            this._execute();
        }
    }

    /**
     * 检查是否可以执行
     */
    public canExecute(): boolean {
        return this._canExecute();
    }

    /**
     * 撤销命令
     */
    public undo(): void {
        if (this._undo) {
            this._undo();
        }
    }

    /**
     * 重做命令
     */
    public redo(): void {
        if (this._redo) {
            this._redo();
        } else {
            this.execute();
        }
    }

    /**
     * 检查是否支持撤销
     */
    public get canUndo(): boolean {
        return this._undo !== undefined;
    }

    /**
     * 检查是否支持重做
     */
    public get canRedo(): boolean {
        return this._redo !== undefined || this._execute !== undefined;
    }
}

/**
 * 异步命令接口
 */
export interface IAsyncCommand {
    /**
     * 异步执行命令
     */
    executeAsync(): Promise<void>;

    /**
     * 检查是否可以执行
     */
    canExecute(): boolean;

    /**
     * 检查是否正在执行
     */
    isExecuting(): boolean;
}

/**
 * 异步命令实现
 */
export class AsyncCommand implements IAsyncCommand {
    private _execute: () => Promise<void>;
    private _canExecute: () => boolean;
    private _isExecuting: boolean = false;

    constructor(
        execute: () => Promise<void>,
        canExecute?: () => boolean
    ) {
        this._execute = execute;
        this._canExecute = canExecute || (() => true);
    }

    /**
     * 异步执行命令
     */
    public async executeAsync(): Promise<void> {
        if (!this.canExecute()) {
            return;
        }

        this._isExecuting = true;
        try {
            await this._execute();
        } finally {
            this._isExecuting = false;
        }
    }

    /**
     * 检查是否可以执行
     */
    public canExecute(): boolean {
        return !this._isExecuting && this._canExecute();
    }

    /**
     * 检查是否正在执行
     */
    public isExecuting(): boolean {
        return this._isExecuting;
    }
}

/**
 * 复合命令 - 可以组合多个命令
 */
export class CompositeCommand implements ICommand {
    private _commands: ICommand[] = [];

    /**
     * 添加命令
     */
    public addCommand(command: ICommand): void {
        this._commands.push(command);
    }

    /**
     * 移除命令
     */
    public removeCommand(command: ICommand): void {
        const index = this._commands.indexOf(command);
        if (index !== -1) {
            this._commands.splice(index, 1);
        }
    }

    /**
     * 清空所有命令
     */
    public clear(): void {
        this._commands.length = 0;
    }

    /**
     * 执行所有命令
     */
    public execute(): void {
        for (const command of this._commands) {
            if (command.canExecute()) {
                command.execute();
            }
        }
    }

    /**
     * 检查是否可以执行（所有命令都可执行时才返回true）
     */
    public canExecute(): boolean {
        return this._commands.every(cmd => cmd.canExecute());
    }

    /**
     * 撤销所有命令（逆序执行）
     */
    public undo(): void {
        for (let i = this._commands.length - 1; i >= 0; i--) {
            const command = this._commands[i];
            if (command.undo) {
                command.undo();
            }
        }
    }

    /**
     * 重做所有命令
     */
    public redo(): void {
        for (const command of this._commands) {
            if (command.redo) {
                command.redo();
            }
        }
    }
}

/**
 * 命令历史管理器
 */
export class CommandHistory {
    private _history: ICommand[] = [];
    private _currentIndex: number = -1;
    private _maxHistorySize: number = 50;

    /**
     * 执行命令并添加到历史
     */
    public executeCommand(command: ICommand): void {
        if (command.canExecute()) {
            command.execute();
            
            // 清除当前位置之后的历史
            if (this._currentIndex < this._history.length - 1) {
                this._history.splice(this._currentIndex + 1);
            }
            
            // 添加到历史
            this._history.push(command);
            this._currentIndex++;
            
            // 限制历史大小
            if (this._history.length > this._maxHistorySize) {
                this._history.shift();
                this._currentIndex--;
            }
        }
    }

    /**
     * 撤销
     */
    public undo(): void {
        if (this.canUndo()) {
            const command = this._history[this._currentIndex];
            if (command.undo) {
                command.undo();
            }
            this._currentIndex--;
        }
    }

    /**
     * 重做
     */
    public redo(): void {
        if (this.canRedo()) {
            this._currentIndex++;
            const command = this._history[this._currentIndex];
            if (command.redo) {
                command.redo();
            }
        }
    }

    /**
     * 检查是否可以撤销
     */
    public canUndo(): boolean {
        return this._currentIndex >= 0 && 
               this._history[this._currentIndex] && 
               this._history[this._currentIndex].undo !== undefined;
    }

    /**
     * 检查是否可以重做
     */
    public canRedo(): boolean {
        return this._currentIndex < this._history.length - 1 &&
               this._history[this._currentIndex + 1] &&
               (this._history[this._currentIndex + 1].redo !== undefined ||
                this._history[this._currentIndex + 1].execute !== undefined);
    }

    /**
     * 清空历史
     */
    public clear(): void {
        this._history.length = 0;
        this._currentIndex = -1;
    }

    /**
     * 获取历史大小
     */
    public get historySize(): number {
        return this._history.length;
    }

    /**
     * 设置最大历史大小
     */
    public set maxHistorySize(size: number) {
        this._maxHistorySize = size;
        if (this._history.length > size) {
            const removeCount = this._history.length - size;
            this._history.splice(0, removeCount);
            this._currentIndex = Math.max(-1, this._currentIndex - removeCount);
        }
    }

    /**
     * 获取最大历史大小
     */
    public get maxHistorySize(): number {
        return this._maxHistorySize;
    }
} 