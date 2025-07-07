import 'reflect-metadata';
import { Observable } from './Observable';
import { DecoratorUtils } from './Decorators';

/**
 * 命令接口
 */
export interface ICommand {
    execute(): void;
    canExecute(): boolean;
}

/**
 * 命令实现
 */
export class Command implements ICommand {
    private executeAction: () => void;
    private canExecuteAction?: () => boolean;

    constructor(executeAction: () => void, canExecuteAction?: () => boolean) {
        this.executeAction = executeAction;
        this.canExecuteAction = canExecuteAction;
    }

    execute(): void {
        if (this.canExecute()) {
            this.executeAction();
        }
    }

    canExecute(): boolean {
        return this.canExecuteAction ? this.canExecuteAction() : true;
    }
}

/**
 * 异步命令实现
 */
export class AsyncCommand implements ICommand {
    private executeAction: () => Promise<void>;
    private canExecuteAction?: () => boolean;
    private isExecuting: boolean = false;

    constructor(executeAction: () => Promise<void>, canExecuteAction?: () => boolean) {
        this.executeAction = executeAction;
        this.canExecuteAction = canExecuteAction;
    }

    async execute(): Promise<void> {
        if (this.canExecute()) {
            this.isExecuting = true;
            try {
                await this.executeAction();
            } finally {
                this.isExecuting = false;
            }
        }
    }

    canExecute(): boolean {
        if (this.isExecuting) return false;
        return this.canExecuteAction ? this.canExecuteAction() : true;
    }
}

/**
 * ViewModel基类
 * 提供MVVM模式的数据绑定功能
 */
export abstract class ViewModel extends Observable {
    private _commands: Map<string, ICommand> = new Map();
    private _validationErrors: Map<string, string> = new Map();
    private _isValidating: boolean = false;
    private _isDirty: boolean = false;

    /**
     * ViewModel名称，用于标识
     */
    public abstract get name(): string;

    constructor() {
        super();
        
        // 初始化装饰器功能
        DecoratorUtils.initializeDecorators(this);
        
        // 调用子类的初始化方法
        this.onInitialize();
    }

    /**
     * 子类可重写的初始化方法
     */
    protected onInitialize(): void {
        // 子类可以重写此方法进行自定义初始化
    }

    /**
     * 创建命令
     */
    public createCommand(name: string, executeAction: () => void, canExecuteAction?: () => boolean): ICommand {
        const command = new Command(executeAction, canExecuteAction);
        this._commands.set(name, command);
        return command;
    }

    /**
     * 创建异步命令
     */
    public createAsyncCommand(name: string, executeAction: () => Promise<void>, canExecuteAction?: () => boolean): ICommand {
        const command = new AsyncCommand(executeAction, canExecuteAction);
        this._commands.set(name, command);
        return command;
    }

    /**
     * 获取命令
     */
    public getCommand(name: string): ICommand | undefined {
        return this._commands.get(name);
    }

    /**
     * 执行命令
     */
    public executeCommand(name: string): void {
        const command = this._commands.get(name);
        if (command) {
            command.execute();
        }
    }

    /**
     * 检查命令是否可执行
     */
    public canExecuteCommand(name: string): boolean {
        const command = this._commands.get(name);
        return command ? command.canExecute() : false;
    }

    /**
     * 验证属性
     */
    public validateProperty(propertyName: string): boolean {
        const validators = DecoratorUtils.getValidators(this.constructor.prototype);
        
        if (validators.has(propertyName)) {
            const { validator, message } = validators.get(propertyName);
            const value = this.getProperty(propertyName);
            const result = validator(value);
            
            if (result === false) {
                const errorMsg = message || `属性 ${propertyName} 验证失败`;
                this._validationErrors.set(propertyName, errorMsg);
                return false;
            } else if (typeof result === 'string') {
                this._validationErrors.set(propertyName, result);
                return false;
            } else {
                this._validationErrors.delete(propertyName);
                return true;
            }
        }
        
        return true;
    }

    /**
     * 验证所有属性
     */
    public validateAll(): boolean {
        this._isValidating = true;
        this._validationErrors.clear();
        
        const validators = DecoratorUtils.getValidators(this.constructor.prototype);
        let isValid = true;
        
        for (const [propertyName] of validators) {
            if (!this.validateProperty(propertyName)) {
                isValid = false;
            }
        }
        
        this._isValidating = false;
        this.notifyObservers('isValid', isValid, !isValid);
        
        return isValid;
    }

    /**
     * 获取验证错误
     */
    public getValidationError(propertyName: string): string | undefined {
        return this._validationErrors.get(propertyName);
    }

    /**
     * 获取所有验证错误
     */
    public getValidationErrors(): Map<string, string> {
        return new Map(this._validationErrors);
    }

    /**
     * 检查是否有验证错误
     */
    public get hasValidationErrors(): boolean {
        return this._validationErrors.size > 0;
    }

    /**
     * 检查是否有效
     */
    public get isValid(): boolean {
        return this._validationErrors.size === 0;
    }

    /**
     * 检查是否正在验证
     */
    public get isValidating(): boolean {
        return this._isValidating;
    }

    /**
     * 检查是否已修改
     */
    public get isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * 标记为已修改
     */
    public markAsDirty(): void {
        if (!this._isDirty) {
            this._isDirty = true;
            this.notifyObservers('isDirty', true, false);
        }
    }

    /**
     * 标记为未修改
     */
    public markAsClean(): void {
        if (this._isDirty) {
            this._isDirty = false;
            this.notifyObservers('isDirty', false, true);
        }
    }

    /**
     * 重写setProperty以支持验证和脏检查
     */
    public override setProperty(propertyName: string, value: any): void {
        const oldValue = this.getProperty(propertyName);
        
        // 如果值没有变化，直接返回
        if (oldValue === value) {
            return;
        }
        
        // 验证属性（如果有验证器）
        const validators = DecoratorUtils.getValidators(this.constructor.prototype);
        if (validators.has(propertyName)) {
            const { validator, message } = validators.get(propertyName);
            const result = validator(value);
            
            if (result === false) {
                const errorMsg = message || `属性 ${propertyName} 验证失败`;
                throw new Error(errorMsg);
            } else if (typeof result === 'string') {
                throw new Error(result);
            }
        }
        
        // 设置属性值
        super.setProperty(propertyName, value);
        
        // 标记为已修改
        this.markAsDirty();
        
        // 清除该属性的验证错误
        if (this._validationErrors.has(propertyName)) {
            this._validationErrors.delete(propertyName);
            this.notifyObservers('isValid', this.isValid, !this.isValid);
        }
    }

    /**
     * 重置ViewModel状态
     */
    public reset(): void {
        this._validationErrors.clear();
        this.markAsClean();
        this.notifyObservers('isValid', true, false);
    }

    /**
     * 获取ViewModel摘要信息
     */
    public getSummary(): any {
        const observableProps = DecoratorUtils.getObservableProperties(this.constructor.prototype);
        const computedProps = DecoratorUtils.getComputedProperties(this.constructor.prototype);
        const commands = DecoratorUtils.getCommands(this.constructor.prototype);
        
        return {
            name: this.name,
            observableProperties: observableProps,
            computedProperties: Array.from(computedProps.keys()),
            commands: Array.from(commands.keys()),
            isDirty: this.isDirty,
            isValid: this.isValid,
            hasValidationErrors: this.hasValidationErrors,
            validationErrors: Object.fromEntries(this._validationErrors)
        };
    }

    /**
     * 销毁ViewModel
     */
    public override destroy(): void {
        this._commands.clear();
        this._validationErrors.clear();
        super.destroy();
    }
} 