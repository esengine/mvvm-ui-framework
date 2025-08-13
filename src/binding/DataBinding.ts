import { IObservable, Observer } from '../core/IObservable';
import { ViewModel } from '../core/ViewModel';

/**
 * 绑定类型
 */
export enum BindingType {
    /** 单向绑定（从数据到视图） */
    ONE_WAY = 'one_way',
    /** 双向绑定 */
    TWO_WAY = 'two_way',
    /** 一次性绑定 */
    ONE_TIME = 'one_time',
    /** 事件绑定 */
    EVENT = 'event'
}

/**
 * 绑定模式
 */
export enum BindingMode {
    /** 替换模式 */
    REPLACE = 'replace',
    /** 追加模式 */
    APPEND = 'append',
    /** 格式化模式 */
    FORMAT = 'format'
}

/**
 * 绑定表达式
 */
export interface BindingExpression {
    /** 原始表达式 */
    expression: string;
    /** 属性路径 */
    path: string[];
    /** 转换器名称 */
    converter?: string;
    /** 转换器参数 */
    converterParams?: any[];
    /** 格式化字符串 */
    format?: string;
}

/**
 * 绑定配置
 */
export interface BindingConfig {
    /** 绑定类型 */
    type: BindingType;
    /** 绑定模式 */
    mode: BindingMode;
    /** 源表达式 */
    source: string;
    /** 目标属性 */
    target: string;
    /** 转换器 */
    converter?: string;
    /** 转换器参数 */
    converterParams?: any[];
    /** 格式化字符串 */
    format?: string;
    /** 是否启用 */
    enabled?: boolean;
    /** 自定义数据 */
    userData?: any;
}

/**
 * 绑定实例
 */
export interface BindingInstance {
    /** 绑定ID */
    id: string;
    /** 配置 */
    config: BindingConfig;
    /** 源表达式 */
    sourceExpression: BindingExpression;
    /** 目标对象 */
    targetObject: any;
    /** 目标属性 */
    targetProperty: string;
    /** 观察者 */
    observer?: Observer;
    /** 是否活跃 */
    active: boolean;
    /** 创建时间 */
    createTime: number;
}

/**
 * 值转换器接口
 */
export interface IValueConverter {
    /**
     * 转换值（从源到目标）
     */
    convert(value: any, params?: any[]): any;
    
    /**
     * 反向转换值（从目标到源）
     */
    convertBack?(value: any, params?: any[]): any;
}

/**
 * 数据绑定系统
 */
export class DataBinding {
    private static _instance: DataBinding;
    
    /** 绑定实例映射 */
    private _bindings: Map<string, BindingInstance> = new Map();
    
    /** 值转换器映射 */
    private _converters: Map<string, IValueConverter> = new Map();
    
    /** 绑定计数器 */
    private _bindingCounter: number = 0;
    
    /** 正在更新的绑定集合（防止循环更新） */
    private _updatingBindings: Set<string> = new Set();

    /**
     * 获取单例实例
     */
    public static getInstance(): DataBinding {
        if (!DataBinding._instance) {
            DataBinding._instance = new DataBinding();
        }
        return DataBinding._instance;
    }

    private constructor() {
        // 注册内置转换器
        this.registerBuiltinConverters();
    }

    /**
     * 注册值转换器
     */
    public registerConverter(name: string, converter: IValueConverter): void {
        this._converters.set(name, converter);
    }

    /**
     * 获取值转换器
     */
    public getConverter(name: string): IValueConverter | undefined {
        return this._converters.get(name);
    }

    /**
     * 创建绑定
     */
    public bind(
        sourceObject: IObservable, 
        targetObject: any, 
        config: BindingConfig
    ): string {
        const bindingId = `binding_${++this._bindingCounter}`;
        
        // 解析源表达式
        const sourceExpression = this.parseExpression(config.source);
        
        // 合并配置中的转换器参数
        if (config.converter && !sourceExpression.converter) {
            sourceExpression.converter = config.converter;
            sourceExpression.converterParams = config.converterParams;
        }
        if (config.format && !sourceExpression.format) {
            sourceExpression.format = config.format;
        }
        
        // 创建绑定实例
        const binding: BindingInstance = {
            id: bindingId,
            config,
            sourceExpression,
            targetObject,
            targetProperty: config.target,
            active: true,
            createTime: Date.now()
        };

        // 创建观察者
        if (config.type !== BindingType.ONE_TIME) {
            binding.observer = (newValue: any, oldValue: any, property: string) => {
                if (binding.active && config.enabled !== false && !this._updatingBindings.has(binding.id)) {
                    // 重新计算值（包括转换器）而不是直接使用newValue
                    // 在FORMAT模式下，跳过getSourceValue中的格式化，让updateTarget处理
                    const skipFormat = binding.config.mode === BindingMode.FORMAT;
                    const computedValue = this.getSourceValue(sourceObject, binding.sourceExpression, skipFormat);
                    this.updateTarget(binding, computedValue);
                }
            };

            // 监听源对象变化
            const watchProperty = sourceExpression.path.length > 0 ? sourceExpression.path[0] : null;
            sourceObject.addObserver(watchProperty, binding.observer);
        }

        // 初始化绑定值
        // 在FORMAT模式下，跳过getSourceValue中的格式化，让updateTarget处理
        const skipFormat = config.mode === BindingMode.FORMAT;
        const initialValue = this.getSourceValue(sourceObject, sourceExpression, skipFormat);
        this.updateTarget(binding, initialValue);

        // 如果是双向绑定，监听目标对象变化
        if (config.type === BindingType.TWO_WAY && targetObject && typeof targetObject === 'object') {
            this.setupTwoWayBinding(binding, sourceObject);
        }

        this._bindings.set(bindingId, binding);
        return bindingId;
    }

    /**
     * 解除绑定
     */
    public unbind(bindingId: string): void {
        const binding = this._bindings.get(bindingId);
        if (!binding) {
            return;
        }

        binding.active = false;
        
        // 移除观察者
        if (binding.observer) {
            // 这里需要从源对象移除观察者
            // 由于我们没有保存源对象的引用，这里只是标记为非活跃
            binding.observer = undefined;
        }

        this._bindings.delete(bindingId);
    }

    /**
     * 解除所有绑定
     */
    public unbindAll(): void {
        for (const bindingId of this._bindings.keys()) {
            this.unbind(bindingId);
        }
    }

    /**
     * 启用/禁用绑定
     */
    public setBindingEnabled(bindingId: string, enabled: boolean): void {
        const binding = this._bindings.get(bindingId);
        if (binding) {
            binding.config.enabled = enabled;
        }
    }

    /**
     * 获取绑定信息
     */
    public getBinding(bindingId: string): BindingInstance | undefined {
        return this._bindings.get(bindingId);
    }

    /**
     * 获取所有绑定
     */
    public getAllBindings(): BindingInstance[] {
        return Array.from(this._bindings.values());
    }

    /**
     * 手动更新绑定
     */
    public updateBinding(bindingId: string, sourceObject: IObservable): void {
        const binding = this._bindings.get(bindingId);
        if (!binding || !binding.active) {
            return;
        }

        const skipFormat = binding.config.mode === BindingMode.FORMAT;
        const value = this.getSourceValue(sourceObject, binding.sourceExpression, skipFormat);
        this.updateTarget(binding, value);
    }

    /**
     * 解析绑定表达式
     */
    private parseExpression(expression: string): BindingExpression {
        const trimmed = expression.trim();
        
        // 检查是否有转换器
        let converter: string | undefined;
        let converterParams: any[] | undefined;
        let format: string | undefined;
        let path = trimmed;

        // 解析转换器 (property | converter:param1:param2)
        const converterMatch = trimmed.match(/^(.+?)\s*\|\s*([^:]+)(?::(.+))?$/);
        if (converterMatch) {
            path = converterMatch[1].trim();
            converter = converterMatch[2].trim();
            if (converterMatch[3]) {
                converterParams = converterMatch[3].split(':').map(p => p.trim());
            }
        }

        // 解析格式化字符串 (property | format:'Hello {0}')
        const formatMatch = trimmed.match(/^(.+?)\s*\|\s*format:\s*['"](.+?)['"]$/);
        if (formatMatch) {
            path = formatMatch[1].trim();
            format = formatMatch[2];
        }

        // 解析属性路径
        const pathArray = path.split('.').filter(p => p.length > 0);

        return {
            expression: trimmed,
            path: pathArray,
            converter,
            converterParams,
            format
        };
    }

    /**
     * 获取源值
     */
    private getSourceValue(sourceObject: any, expression: BindingExpression, skipFormat: boolean = false): any {
        let value = sourceObject;
        
        // 沿着属性路径获取值
        for (const prop of expression.path) {
            if (value == null) {
                return '';
            }
            value = value[prop];
        }

        // 应用转换器
        if (expression.converter) {
            const converter = this._converters.get(expression.converter);
            if (converter) {
                value = converter.convert(value, expression.converterParams);
            }
        }

        // 应用格式化（除非跳过格式化）
        if (expression.format && !skipFormat) {
            value = this.formatValue(value, expression.format);
        }

        // 确保不返回undefined
        return value == null ? '' : value;
    }

    /**
     * 更新目标值
     */
    private updateTarget(binding: BindingInstance, value: any): void {
        const { targetObject, targetProperty, config } = binding;
        
        if (!targetObject) {
            return;
        }

        try {
            switch (config.mode) {
                case BindingMode.REPLACE:
                    targetObject[targetProperty] = value;
                    break;
                    
                case BindingMode.APPEND:
                    if (typeof targetObject[targetProperty] === 'string') {
                        targetObject[targetProperty] += String(value);
                    } else if (Array.isArray(targetObject[targetProperty])) {
                        targetObject[targetProperty].push(value);
                    }
                    break;
                    
                case BindingMode.FORMAT:
                    if (config.format) {
                        targetObject[targetProperty] = this.formatValue(value, config.format);
                    } else {
                        targetObject[targetProperty] = value;
                    }
                    break;
            }
        } catch (error) {
            console.error('绑定更新目标值失败:', error);
        }
    }

    /**
     * 设置双向绑定
     */
    private setupTwoWayBinding(binding: BindingInstance, sourceObject: IObservable): void {
        const { targetObject, targetProperty, sourceExpression } = binding;
        
        // 这里需要监听目标对象的变化
        // 由于我们不知道目标对象的类型，这里只是示例实现
        if (targetObject && typeof targetObject.addObserver === 'function') {
            const targetObserver = (newValue: any) => {
                if (binding.active && !this._updatingBindings.has(binding.id)) {
                    this.updateSource(sourceObject, sourceExpression, newValue, binding.id);
                }
            };
            
            targetObject.addObserver(targetProperty, targetObserver);
        }
    }

    /**
     * 更新源值（双向绑定）
     */
    private updateSource(sourceObject: any, expression: BindingExpression, value: any, bindingId?: string): void {
        if (expression.path.length === 0) {
            return;
        }

        // 防止循环更新
        if (bindingId && this._updatingBindings.has(bindingId)) {
            return;
        }

        if (bindingId) {
            this._updatingBindings.add(bindingId);
        }

        // 反向转换值
        if (expression.converter) {
            const converter = this._converters.get(expression.converter);
            if (converter && converter.convertBack) {
                value = converter.convertBack(value, expression.converterParams);
            }
        }

        // 设置源对象的值
        let target = sourceObject;
        for (let i = 0; i < expression.path.length - 1; i++) {
            target = target[expression.path[i]];
            if (target == null) {
                return;
            }
        }

        const lastProperty = expression.path[expression.path.length - 1];
        
        try {
            if (typeof target.setProperty === 'function') {
                target.setProperty(lastProperty, value);
            } else {
                target[lastProperty] = value;
            }
        } finally {
            // 清理循环检测标记
            if (bindingId) {
                this._updatingBindings.delete(bindingId);
            }
        }
    }

    /**
     * 格式化值
     */
    private formatValue(value: any, format: string): string {
        if (value == null) {
            return '';
        }

        // 简单的字符串格式化实现
        return format.replace(/\{(\d+)\}/g, (match, index) => {
            if (Array.isArray(value)) {
                return String(value[parseInt(index)] || '');
            }
            return index === '0' ? String(value) : match;
        });
    }

    /**
     * 注册内置转换器
     */
    private registerBuiltinConverters(): void {
        // 布尔转换器
        this.registerConverter('bool', {
            convert: (value: any) => Boolean(value).toString(),
            convertBack: (value: any) => value === 'true' || value === true
        });

        // 数字转换器
        this.registerConverter('number', {
            convert: (value: any) => (Number(value) || 0).toString(),
            convertBack: (value: any) => Number(value) || 0
        });

        // 字符串转换器
        this.registerConverter('string', {
            convert: (value: any) => String(value),
            convertBack: (value: any) => String(value)
        });

        // 日期转换器
        this.registerConverter('date', {
            convert: (value: any, params?: any[]) => {
                if (value instanceof Date) {
                    const format = params && params[0] ? params[0] : 'yyyy-MM-dd';
                    return this.formatDate(value, format);
                }
                return String(value);
            },
            convertBack: (value: any) => {
                if (typeof value === 'string') {
                    return new Date(value);
                }
                return value;
            }
        });

        // 可见性转换器
        this.registerConverter('visibility', {
            convert: (value: any) => value ? 'visible' : 'hidden',
            convertBack: (value: any) => value === 'visible'
        });

        // 反转转换器
        this.registerConverter('not', {
            convert: (value: any) => (!value).toString(),
            convertBack: (value: any) => !(value === 'true' || value === true)
        });
    }

    /**
     * 格式化日期
     */
    private formatDate(date: Date, format: string): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace(/yyyy/g, String(year))
            .replace(/MM/g, month)
            .replace(/dd/g, day)
            .replace(/HH/g, hours)
            .replace(/mm/g, minutes)
            .replace(/ss/g, seconds);
    }
}

/**
 * 全局数据绑定实例
 */
export const dataBinding = DataBinding.getInstance();

/**
 * 绑定装饰器
 */
export function Bindable(target: any, propertyKey: string): void {
    const privateKey = `_${propertyKey}`;
    
    // 定义getter和setter
    Object.defineProperty(target, propertyKey, {
        get: function() {
            return this[privateKey];
        },
        set: function(value: any) {
            const oldValue = this[privateKey];
            this[privateKey] = value;
            
            // 如果对象是可观察的，通知观察者
            if (this.notifyObservers && typeof this.notifyObservers === 'function') {
                this.notifyObservers(propertyKey, value, oldValue);
            }
        },
        enumerable: true,
        configurable: true
    });
} 