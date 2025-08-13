import 'reflect-metadata';
import { Observable } from './Observable';
import { DecoratorUtils } from './Decorators';
import { ParameterizedCommand, AsyncParameterizedCommand } from './Command';
import { FilteredCommandMethods, CommandParameters, CommandReturnType, CommandInfo, NoParamCommands, ParamCommands, TypeSafeCommandExecutor } from './TypeUtils';

/**
 * 命令接口
 */
export interface ICommand {
    execute(): any;
    canExecute(): boolean;
}

/**
 * 命令实现
 */
export class Command implements ICommand {
    private executeAction: () => any;
    private canExecuteAction?: () => boolean;

    constructor(executeAction: () => any, canExecuteAction?: () => boolean) {
        this.executeAction = executeAction;
        this.canExecuteAction = canExecuteAction;
    }

    execute(): any {
        if (this.canExecute()) {
            return this.executeAction();
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
    private executeAction: () => Promise<any>;
    private canExecuteAction?: () => boolean;
    private isExecuting: boolean = false;

    constructor(executeAction: () => Promise<any>, canExecuteAction?: () => boolean) {
        this.executeAction = executeAction;
        this.canExecuteAction = canExecuteAction;
    }

    async execute(): Promise<any> {
        if (this.canExecute()) {
            this.isExecuting = true;
            try {
                return await this.executeAction();
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
export abstract class ViewModel extends Observable implements TypeSafeCommandExecutor<ViewModel> {
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
    public createCommand(name: string, executeAction: () => any, canExecuteAction?: () => boolean): ICommand {
        const command = new Command(executeAction, canExecuteAction);
        this._commands.set(name, command);
        return command;
    }

    /**
     * 创建参数化命令
     */
    public createParameterizedCommand(name: string, executeAction: (...args: any[]) => any, canExecuteAction?: (...args: any[]) => boolean): ICommand {
        const command = new ParameterizedCommand(executeAction, canExecuteAction);
        this._commands.set(name, command);
        return command;
    }

    /**
     * 创建异步命令
     */
    public createAsyncCommand(name: string, executeAction: () => Promise<any>, canExecuteAction?: () => boolean): ICommand {
        const command = new AsyncCommand(executeAction, canExecuteAction);
        this._commands.set(name, command);
        return command;
    }

    /**
     * 创建异步参数化命令
     */
    public createAsyncParameterizedCommand(name: string, executeAction: (...args: any[]) => Promise<any>, canExecuteAction?: (...args: any[]) => boolean): ICommand {
        const command = new AsyncParameterizedCommand(executeAction, canExecuteAction);
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
     * 执行无参数命令（类型安全）
     * 
     * @param name - 命令名称，必须是无参数的命令方法
     * @returns 命令执行结果
     */
    public executeCommand<K extends FilteredCommandMethods<this> & NoParamCommands<this>>(
        name: K
    ): CommandReturnType<this, K>;
    
    /**
     * 执行有参数命令（类型安全）
     * 
     * @param name - 命令名称，必须是有参数的命令方法
     * @param args - 命令参数
     * @returns 命令执行结果
     */
    public executeCommand<K extends FilteredCommandMethods<this> & ParamCommands<this>>(
        name: K, 
        ...args: CommandParameters<this, K>
    ): CommandReturnType<this, K>;
    
    /**
     * 传统字符串方式执行命令（向后兼容）
     * 
     * @param name - 命令名称字符串
     * @param args - 命令参数
     * @returns void
     */
    public executeCommand(name: string, ...args: any[]): void;
    
    /**
     * 执行命令的实现
     * 
     * @param name - 命令名称
     * @param args - 命令参数
     * @returns 命令执行结果
     */
    public executeCommand(name: any, ...args: any[]): any {
        // 首先检查装饰器注册的命令
        const registeredCommand = this._commands.get(name);
        if (registeredCommand) {
            return this.executeRegisteredCommand(registeredCommand, name, ...args);
        }
        
        // 尝试直接方法调用（类型安全路径）
        if (typeof name === 'string' && typeof (this as any)[name] === 'function') {
            return this.executeDirectMethod(name, ...args);
        }
        
        // 命令不存在
        console.warn(`命令 '${name}' 不存在`);
    }

    /**
     * 执行已注册的命令
     * 
     * @private
     * @param command - 命令实例
     * @param name - 命令名称
     * @param args - 命令参数
     * @returns 命令执行结果
     */
    private executeRegisteredCommand(command: ICommand, name: string, ...args: any[]): any {
        const isParameterizedCommand = command instanceof ParameterizedCommand || command instanceof AsyncParameterizedCommand;
        
        if (isParameterizedCommand) {
            // 参数化命令
            if (!command.canExecute(...args)) {
                return;
            }
            return command.execute(...args);
        } else {
            // 普通命令
            if (!command.canExecute()) {
                return;
            }
            
            if (args.length > 0) {
                console.warn(`命令 ${name} 不支持参数，参数将被忽略`);
            }
            return command.execute();
        }
    }

    /**
     * 执行直接方法调用
     * 
     * @private
     * @param name - 方法名
     * @param args - 方法参数
     * @returns 方法返回值
     */
    private executeDirectMethod(name: string, ...args: any[]): any {
        // 检查是否有对应的canExecute方法
        const canExecuteMethodName = `can${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        if (typeof (this as any)[canExecuteMethodName] === 'function') {
            const canExecuteMethod = (this as any)[canExecuteMethodName];
            let canExecuteResult: boolean;
            
            // 根据canExecute方法是否需要参数来决定调用方式
            if (canExecuteMethod.length > 0) {
                canExecuteResult = canExecuteMethod.apply(this, args);
            } else {
                canExecuteResult = canExecuteMethod.call(this);
            }
            
            if (!canExecuteResult) {
                return; // 不执行命令
            }
        }
        
        // 执行方法并返回结果
        const method = (this as any)[name];
        return method.apply(this, args);
    }

    /**
     * 检查命令是否可执行（类型安全）
     * 
     * @param name - 命令名称，必须是有效的命令方法名
     * @returns 命令是否可执行
     */
    public canExecuteCommand<K extends FilteredCommandMethods<this>>(name: K): boolean;
    
    /**
     * 检查命令是否可执行（传统方式）
     * 
     * @param name - 命令名称字符串
     * @returns 命令是否可执行
     */
    public canExecuteCommand(name: string): boolean;
    
    /**
     * 检查命令是否可执行的实现
     * 
     * @param name - 命令名称
     * @returns 命令是否可执行
     */
    public canExecuteCommand(name: any): boolean {
        const command = this._commands.get(name);
        if (command) {
            return command.canExecute();
        }
        
        // 对于直接方法调用，检查是否存在对应的canExecute方法
        if (typeof (this as any)[name] === 'function') {
            // 首先检查具体的canXxx方法
            const canExecuteMethodName = `can${name.charAt(0).toUpperCase()}${name.slice(1)}`;
            if (typeof (this as any)[canExecuteMethodName] === 'function') {
                return (this as any)[canExecuteMethodName]();
            }
            
            // 对于conditionalReset这样的命令，可能有canReset方法
            if (name === 'conditionalReset' && typeof (this as any)['canReset'] === 'function') {
                return (this as any)['canReset']();
            }
            
            return true; // 默认可执行
        }
        
        return false; // 命令不存在
    }
    
    /**
     * 获取所有可用命令的信息
     * 
     * @returns 命令信息数组，包含命令名称、参数信息和可执行状态
     */
    public getCommands(): CommandInfo[] {
        const commands: CommandInfo[] = [];
        
        // 从装饰器注册的命令获取
        for (const [name, command] of this._commands) {
            // 尝试从原型获取原始方法来确定参数数量
            let parameterCount = 0;
            if (typeof (this as any)[name] === 'function') {
                parameterCount = (this as any)[name].length;
            }
            
            const info: CommandInfo = {
                name,
                hasParameters: command instanceof ParameterizedCommand || command instanceof AsyncParameterizedCommand || parameterCount > 0,
                isAsync: command instanceof AsyncParameterizedCommand,
                parameterCount,
                canExecute: this.canExecuteCommand(name)
            };
            commands.push(info);
        }
        
        // 从类原型获取所有方法（用于类型安全的直接调用）
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype);
        
        for (const methodName of methodNames) {
            if (typeof (this as any)[methodName] === 'function' && 
                !['constructor', 'destroy', 'addObserver', 'removeObserver', 'notifyObservers',
                  'setProperty', 'getProperty', 'markAsDirty', 'markAsClean', 'name'].includes(methodName) &&
                !methodName.startsWith('_') &&
                !commands.find(c => c.name === methodName)) {
                
                const method = (this as any)[methodName];
                const info: CommandInfo = {
                    name: methodName,
                    hasParameters: method.length > 0,
                    isAsync: method.constructor.name === 'AsyncFunction',
                    parameterCount: method.length,
                    canExecute: true
                };
                commands.push(info);
            }
        }
        
        return commands;
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