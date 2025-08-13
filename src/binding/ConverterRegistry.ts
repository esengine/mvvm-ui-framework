/**
 * 转换器注册表
 * 管理所有值转换器的类型定义和注册
 */

import { IValueConverter } from './DataBinding';
import { ConverterName, ConverterTypeMap } from './TypeSafeBinding';

/**
 * 类型安全的值转换器接口
 */
export interface ITypeSafeValueConverter<
    TInput = any,
    TOutput = any
> extends IValueConverter {
    /**
     * 转换值（从源到目标）
     */
    convert(value: TInput, params?: any[]): TOutput;
    
    /**
     * 反向转换值（从目标到源）
     */
    convertBack?(value: TOutput, params?: any[]): TInput;
}

/**
 * 转换器定义接口
 */
export interface ConverterDefinition<
    TInput = any,
    TOutput = any
> {
    /** 转换器实现 */
    converter: ITypeSafeValueConverter<TInput, TOutput>;
    /** 转换器描述 */
    description?: string;
    /** 是否支持反向转换 */
    supportsTwoWay?: boolean;
}

/**
 * 内置转换器实现
 */
export class BuiltinConverters {
    /**
     * 字符串转换器 - 将任何值转换为字符串
     */
    static readonly string: ITypeSafeValueConverter<any, string> = {
        convert: (value: any): string => String(value ?? ''),
        convertBack: (value: string): string => value
    };

    /**
     * 数字转换器 - 将任何值转换为数字字符串
     */
    static readonly number: ITypeSafeValueConverter<any, string> = {
        convert: (value: any): string => {
            const num = Number(value);
            return isNaN(num) ? '0' : num.toString();
        },
        convertBack: (value: string): number => {
            const num = Number(value);
            return isNaN(num) ? 0 : num;
        }
    };

    /**
     * 布尔转换器 - 将任何值转换为布尔字符串
     */
    static readonly bool: ITypeSafeValueConverter<any, string> = {
        convert: (value: any): string => Boolean(value).toString(),
        convertBack: (value: string): boolean => value === 'true'
    };

    /**
     * 日期转换器 - 将日期转换为格式化字符串
     */
    static readonly date: ITypeSafeValueConverter<Date | string | number, string> = {
        convert: (value: Date | string | number, params?: any[]): string => {
            let date: Date;
            
            if (value instanceof Date) {
                date = value;
            } else if (typeof value === 'string' || typeof value === 'number') {
                date = new Date(value);
                if (isNaN(date.getTime())) {
                    return '';
                }
            } else {
                return '';
            }
            
            const format = params && params[0] ? params[0] : 'yyyy-MM-dd';
            return BuiltinConverters.formatDate(date, format);
        },
        convertBack: (value: string): Date => {
            const date = new Date(value);
            return isNaN(date.getTime()) ? new Date() : date;
        }
    };

    /**
     * 可见性转换器 - 将布尔值转换为CSS可见性值
     */
    static readonly visibility: ITypeSafeValueConverter<boolean, 'visible' | 'hidden'> = {
        convert: (value: boolean): 'visible' | 'hidden' => value ? 'visible' : 'hidden',
        convertBack: (value: 'visible' | 'hidden'): boolean => value === 'visible'
    };

    /**
     * 反转转换器 - 将值转换为其反转的布尔值
     */
    static readonly not: ITypeSafeValueConverter<any, boolean> = {
        convert: (value: any): boolean => !value,
        convertBack: (value: boolean): boolean => !value
    };

    /**
     * 格式化日期
     */
    private static formatDate(date: Date, format: string): string {
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
 * 转换器注册表类
 */
export class ConverterRegistry {
    private _converters: Map<string, ConverterDefinition> = new Map();

    /**
     * 注册内置转换器
     */
    public registerBuiltinConverters(): void {
        this.register('string', {
            converter: BuiltinConverters.string,
            description: '将任何值转换为字符串',
            supportsTwoWay: true
        });

        this.register('number', {
            converter: BuiltinConverters.number,
            description: '将任何值转换为数字字符串',
            supportsTwoWay: true
        });

        this.register('bool', {
            converter: BuiltinConverters.bool,
            description: '将任何值转换为布尔字符串',
            supportsTwoWay: true
        });

        this.register('date', {
            converter: BuiltinConverters.date,
            description: '将日期转换为格式化字符串',
            supportsTwoWay: true
        });

        this.register('visibility', {
            converter: BuiltinConverters.visibility,
            description: '将布尔值转换为CSS可见性值',
            supportsTwoWay: true
        });

        this.register('not', {
            converter: BuiltinConverters.not,
            description: '反转布尔值',
            supportsTwoWay: true
        });
    }

    /**
     * 注册转换器
     */
    public register<TName extends string>(
        name: TName,
        definition: ConverterDefinition
    ): void {
        this._converters.set(name, definition);
    }

    /**
     * 获取转换器
     */
    public get(name: ConverterName): ConverterDefinition | undefined {
        return this._converters.get(name);
    }

    /**
     * 检查转换器是否存在
     */
    public has(name: string): boolean {
        return this._converters.has(name);
    }

    /**
     * 获取所有转换器名称
     */
    public getNames(): string[] {
        return Array.from(this._converters.keys());
    }

    /**
     * 获取转换器定义
     */
    public getDefinition(name: string): ConverterDefinition | undefined {
        return this._converters.get(name);
    }

    /**
     * 移除转换器
     */
    public unregister(name: string): boolean {
        return this._converters.delete(name);
    }

    /**
     * 清空所有转换器
     */
    public clear(): void {
        this._converters.clear();
    }

    /**
     * 获取转换器数量
     */
    public get size(): number {
        return this._converters.size;
    }
}

/**
 * 全局转换器注册表实例
 */
export const converterRegistry = new ConverterRegistry();

/**
 * 类型安全的转换器注册函数
 */
export function registerConverter<
    TName extends string,
    TInput,
    TOutput
>(
    name: TName,
    converter: ITypeSafeValueConverter<TInput, TOutput>,
    description?: string
): void {
    converterRegistry.register(name, {
        converter,
        description,
        supportsTwoWay: converter.convertBack !== undefined
    });
}

/**
 * 获取转换器的类型安全版本
 */
export function getConverter<T extends ConverterName>(
    name: T
): ITypeSafeValueConverter<
    ConverterTypeMap[T]['input'],
    ConverterTypeMap[T]['output']
> | undefined {
    const definition = converterRegistry.get(name);
    return definition?.converter as any;
}

/**
 * 验证转换器类型兼容性
 */
export function validateConverterCompatibility<
    TSourceType,
    TTargetType,
    TConverter extends ConverterName
>(
    sourceType: TSourceType,
    targetType: TTargetType,
    converterName: TConverter
): boolean {
    const converter = getConverter(converterName);
    if (!converter) {
        return false;
    }

    // 这里可以添加更复杂的类型兼容性检查逻辑
    // 目前简单返回true，实际使用中由TypeScript类型系统保证兼容性
    return true;
}

/**
 * 转换器类型映射扩展
 * 允许用户扩展自定义转换器类型
 */
declare global {
    namespace TypeSafeBinding {
        interface CustomConverterTypeMap {
            // 用户可以在此处扩展自定义转换器类型
            // 例如：'currency': { input: number; output: string };
        }
    }
}

/**
 * 合并的转换器类型映射
 */
export type ExtendedConverterTypeMap = ConverterTypeMap & TypeSafeBinding.CustomConverterTypeMap;

/**
 * 扩展的转换器名称
 */
export type ExtendedConverterName = keyof ExtendedConverterTypeMap;