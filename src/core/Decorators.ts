import 'reflect-metadata';
import { IObservable } from './IObservable';

// 元数据键
const OBSERVABLE_KEY = Symbol('observable');
const COMPUTED_KEY = Symbol('computed');
const COMMAND_KEY = Symbol('command');
const VALIDATOR_KEY = Symbol('validator');
const READONLY_KEY = Symbol('readonly');

/**
 * 可观察属性装饰器
 * 自动为属性添加getter/setter，并在值变化时通知观察者
 */
export function observable(target: any, propertyKey: string): void {
    const privateKey = `_${propertyKey}`;
    
    // 存储元数据
    const observableProps = Reflect.getMetadata(OBSERVABLE_KEY, target) || [];
    observableProps.push(propertyKey);
    Reflect.defineMetadata(OBSERVABLE_KEY, observableProps, target);
    
    // 定义getter和setter
    Object.defineProperty(target, propertyKey, {
        get: function(this: any) {
            return this[privateKey];
        },
        set: function(this: any, value: any) {
            const oldValue = this[privateKey];
            if (oldValue !== value) {
                this[privateKey] = value;
                
                // 如果对象实现了可观察接口，通知观察者
                if (this.notifyObservers && typeof this.notifyObservers === 'function') {
                    this.notifyObservers(propertyKey, value, oldValue);
                }
                
                // 触发计算属性更新
                this._invalidateComputedProps?.(propertyKey);
            }
        },
        enumerable: true,
        configurable: true
    });
}

/**
 * 计算属性装饰器
 * 用于标记依赖其他属性的计算属性
 */
export function computed(dependencies: string[]) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalGetter = descriptor.get;
        if (!originalGetter) {
            throw new Error(`@computed 装饰器只能用于 getter 方法`);
        }

        // 存储计算属性元数据
        const computedProps = Reflect.getMetadata(COMPUTED_KEY, target) || new Map();
        computedProps.set(propertyKey, {
            dependencies,
            getter: originalGetter,
            cacheKey: `_computed_${propertyKey}`,
            validKey: `_computed_valid_${propertyKey}`
        });
        Reflect.defineMetadata(COMPUTED_KEY, computedProps, target);

        const cacheKey = `_computed_${propertyKey}`;
        const validKey = `_computed_valid_${propertyKey}`;

        descriptor.get = function(this: any) {
            // 如果缓存有效，直接返回缓存值
            if (this[validKey] && this.hasOwnProperty(cacheKey)) {
                return this[cacheKey];
            }

            // 计算新值
            const value = originalGetter.call(this);
            this[cacheKey] = value;
            this[validKey] = true;

            return value;
        };

        return descriptor;
    };
}

/**
 * 命令装饰器
 * 自动为方法创建命令
 */
export function command(canExecuteMethod?: string) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function') {
            throw new Error(`@command 装饰器只能用于方法`);
        }

        // 存储命令元数据
        const commands = Reflect.getMetadata(COMMAND_KEY, target) || new Map();
        commands.set(propertyKey, {
            method: originalMethod,
            canExecuteMethod
        });
        Reflect.defineMetadata(COMMAND_KEY, commands, target);

        return descriptor;
    };
}

/**
 * 验证装饰器
 * 为属性添加验证规则
 */
export function validate(validator: (value: any) => boolean | string, message?: string) {
    return function(target: any, propertyKey: string): void {
        // 存储验证器元数据
        const validators = Reflect.getMetadata(VALIDATOR_KEY, target) || new Map();
        validators.set(propertyKey, { validator, message });
        Reflect.defineMetadata(VALIDATOR_KEY, validators, target);
    };
}

/**
 * 防抖装饰器
 * 为方法添加防抖功能
 */
export function debounce(delay: number) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function') {
            throw new Error(`@debounce 装饰器只能用于方法`);
        }

        const timeoutKey = `_debounce_${propertyKey}`;

        descriptor.value = function(this: any, ...args: any[]) {
            // 清除之前的定时器
            if (this[timeoutKey]) {
                clearTimeout(this[timeoutKey]);
            }

            // 设置新的定时器
            this[timeoutKey] = setTimeout(() => {
                originalMethod.apply(this, args);
                this[timeoutKey] = null;
            }, delay);
        };

        return descriptor;
    };
}

/**
 * 节流装饰器
 * 为方法添加节流功能
 */
export function throttle(delay: number) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function') {
            throw new Error(`@throttle 装饰器只能用于方法`);
        }

        const lastCallKey = `_throttle_last_${propertyKey}`;
        const timeoutKey = `_throttle_timeout_${propertyKey}`;

        descriptor.value = function(this: any, ...args: any[]) {
            const now = Date.now();
            const lastCall = this[lastCallKey] || 0;
            const remaining = delay - (now - lastCall);

            if (remaining <= 0) {
                // 立即执行
                this[lastCallKey] = now;
                originalMethod.apply(this, args);
            } else if (!this[timeoutKey]) {
                // 设置延迟执行
                this[timeoutKey] = setTimeout(() => {
                    this[lastCallKey] = Date.now();
                    this[timeoutKey] = null;
                    originalMethod.apply(this, args);
                }, remaining);
            }
        };

        return descriptor;
    };
}

/**
 * 异步装饰器
 * 为异步方法添加状态管理
 */
export function async(loadingProperty?: string, errorProperty?: string) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function') {
            throw new Error(`@async 装饰器只能用于方法`);
        }

        const loadingKey = loadingProperty || `${propertyKey}Loading`;
        const errorKey = errorProperty || `${propertyKey}Error`;

        descriptor.value = async function(this: any, ...args: any[]) {
            try {
                // 设置加载状态
                if (this.setProperty && typeof this.setProperty === 'function') {
                    this.setProperty(loadingKey, true);
                    this.setProperty(errorKey, null);
                }

                const result = await originalMethod.apply(this, args);
                return result;
            } catch (error) {
                // 设置错误状态
                if (this.setProperty && typeof this.setProperty === 'function') {
                    this.setProperty(errorKey, error);
                }
                throw error;
            } finally {
                // 清除加载状态
                if (this.setProperty && typeof this.setProperty === 'function') {
                    this.setProperty(loadingKey, false);
                }
            }
        };

        return descriptor;
    };
}

/**
 * 只读装饰器
 * 创建只读属性
 */
export function readonly(target: any, propertyKey: string): void {
    const privateKey = `_${propertyKey}`;
    
    // 存储只读属性元数据
    const readonlyProps = Reflect.getMetadata(READONLY_KEY, target) || [];
    readonlyProps.push(propertyKey);
    Reflect.defineMetadata(READONLY_KEY, readonlyProps, target);
    
    Object.defineProperty(target, propertyKey, {
        get: function(this: any) {
            return this[privateKey];
        },
        set: function(this: any, value: any) {
            // 只允许在初始化时设置一次
            if (this[privateKey] === undefined) {
                this[privateKey] = value;
            } else {
                console.warn(`属性 ${propertyKey} 是只读的，不能修改`);
            }
        },
        enumerable: true,
        configurable: false
    });
}

/**
 * ViewModel 类装饰器
 * 自动初始化装饰器功能
 */
export function viewModel<T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
        constructor(...args: any[]) {
            super(...args);
            
            // 自动初始化装饰器功能
            DecoratorUtils.initializeDecorators(this);
        }
    };
}

/**
 * 装饰器工具类
 * 提供获取元数据的辅助方法
 */
export class DecoratorUtils {
    /**
     * 获取可观察属性列表
     */
    static getObservableProperties(target: any): string[] {
        return Reflect.getMetadata(OBSERVABLE_KEY, target) || [];
    }

    /**
     * 获取计算属性映射
     */
    static getComputedProperties(target: any): Map<string, any> {
        return Reflect.getMetadata(COMPUTED_KEY, target) || new Map();
    }

    /**
     * 获取命令映射
     */
    static getCommands(target: any): Map<string, any> {
        return Reflect.getMetadata(COMMAND_KEY, target) || new Map();
    }

    /**
     * 获取验证器映射
     */
    static getValidators(target: any): Map<string, any> {
        return Reflect.getMetadata(VALIDATOR_KEY, target) || new Map();
    }

    /**
     * 获取只读属性列表
     */
    static getReadonlyProperties(target: any): string[] {
        return Reflect.getMetadata(READONLY_KEY, target) || [];
    }

    /**
     * 初始化装饰器功能
     * 应该在对象构造后调用
     */
    static initializeDecorators(instance: any): void {
        this.initializeObservableProperties(instance);
        
        // 初始化计算属性依赖监听
        this.initializeComputedProperties(instance);
        
        // 初始化命令
        this.initializeCommands(instance);
        
        // 初始化验证器
        this.initializeValidators(instance);
    }

    /**
     * 初始化可观察属性
     */
    private static initializeObservableProperties(instance: any): void {
        const observableProps = this.getObservableProperties(instance.constructor.prototype);
        
        for (const propertyKey of observableProps) {
            const privateKey = `_${propertyKey}`;
            
            // 检查实例上是否有直接的属性值（TypeScript 初始化的）
            if (instance.hasOwnProperty(propertyKey)) {
                const currentValue = instance[propertyKey];
                
                // 删除实例上的直接属性，让原型上的 getter/setter 生效
                delete instance[propertyKey];
                
                // 将值存储到私有属性
                instance[privateKey] = currentValue;
                
                console.log(`重新应用可观察属性: ${propertyKey}, 初始值: ${currentValue}`);
            }
        }
    }

    /**
     * 初始化计算属性
     */
    private static initializeComputedProperties(instance: any): void {
        const computedProps = this.getComputedProperties(instance.constructor.prototype);
        
        // 添加计算属性失效方法
        instance._invalidateComputedProps = (changedProperty: string) => {
            for (const [propName, propInfo] of computedProps) {
                if (propInfo.dependencies.includes(changedProperty)) {
                    instance[propInfo.validKey] = false;
                    
                    // 重新计算并通知
                    const newValue = instance[propName];
                    if (instance.notifyObservers) {
                        instance.notifyObservers(propName, newValue, instance[propInfo.cacheKey]);
                    }
                }
            }
        };
    }

    /**
     * 初始化命令
     */
    private static initializeCommands(instance: any): void {
        const commands = this.getCommands(instance.constructor.prototype);
        
        if (commands.size > 0 && instance.createCommand) {
            for (const [commandName, commandInfo] of commands) {
                const canExecute = commandInfo.canExecuteMethod ? 
                    () => instance[commandInfo.canExecuteMethod]() : 
                    undefined;
                
                instance.createCommand(commandName, () => commandInfo.method.call(instance), canExecute);
            }
        }
    }

    /**
     * 初始化验证器
     */
    private static initializeValidators(instance: any): void {
        const validators = this.getValidators(instance.constructor.prototype);
        
        if (validators.size > 0) {
            // 重写setProperty方法以包含验证
            const originalSetProperty = instance.setProperty;
            if (originalSetProperty) {
                instance.setProperty = function(propertyName: string, value: any) {
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
                    
                    return originalSetProperty.call(this, propertyName, value);
                };
            }
        }
    }
} 