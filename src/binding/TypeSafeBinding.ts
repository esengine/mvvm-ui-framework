/**
 * 类型安全绑定系统
 * 提供编译时类型检查、智能提示和重构安全性
 */

import { BindingType, BindingMode } from './DataBinding';

/**
 * 提取对象中所有非函数属性名（可观察属性）
 */
export type ObservableKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 提取对象中所有可写入的属性名
 */
export type WritableKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 获取对象指定属性的类型
 */
export type PropertyType<T, K extends keyof T> = T[K];

/**
 * 检查源类型是否可以赋值给目标类型
 */
export type IsAssignable<Source, Target> = Source extends Target ? true : false;

/**
 * 检查两个类型是否兼容（互相可赋值）
 */
export type IsCompatible<A, B> = IsAssignable<A, B> extends true 
    ? true 
    : IsAssignable<B, A> extends true 
        ? true 
        : false;

/**
 * 属性路径类型 - 支持嵌套属性访问
 */
export type PropertyPath<T, K extends keyof T = keyof T> = K extends string
    ? T[K] extends object
        ? `${K}` | `${K}.${PropertyPath<T[K]>}`
        : `${K}`
    : never;

/**
 * 根据属性路径获取类型
 */
export type PropertyTypeByPath<T, Path extends string> = 
    Path extends `${infer Key}.${infer Rest}`
        ? Key extends keyof T
            ? PropertyTypeByPath<T[Key], Rest>
            : never
        : Path extends keyof T
            ? T[Path]
            : never;

/**
 * 转换器输入输出类型映射
 */
export interface ConverterTypeMap {
    'string': { input: any; output: string };
    'number': { input: any; output: number };
    'bool': { input: any; output: boolean };
    'date': { input: Date | string | number; output: string };
    'visibility': { input: boolean; output: 'visible' | 'hidden' };
    'not': { input: any; output: boolean };
}

/**
 * 转换器名称联合类型
 */
export type ConverterName = keyof ConverterTypeMap;

/**
 * 获取转换器的输入类型
 */
export type ConverterInputType<T extends ConverterName> = ConverterTypeMap[T]['input'];

/**
 * 获取转换器的输出类型
 */
export type ConverterOutputType<T extends ConverterName> = ConverterTypeMap[T]['output'];

/**
 * 类型安全的绑定配置接口
 */
export interface TypeSafeBindingConfig<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>,
    TConverter extends ConverterName | undefined = undefined
> {
    /** 绑定类型 */
    type: BindingType;
    /** 绑定模式 */
    mode: BindingMode;
    /** 源属性名 - 必须是源对象的有效属性 */
    source: TSourceKey;
    /** 目标属性名 - 必须是目标对象的有效属性 */
    target: TTargetKey;
    /** 转换器 - 必须是已注册的转换器 */
    converter?: TConverter;
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
 * 类型约束验证 - 确保绑定的类型兼容性
 */
export type BindingTypeConstraints<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>,
    TConverter extends ConverterName | undefined
> = TConverter extends ConverterName
    ? // 如果使用转换器，检查：
      // 1. 源类型是否兼容转换器输入类型
      // 2. 转换器输出类型是否兼容目标类型
      IsCompatible<PropertyType<TSource, TSourceKey>, ConverterInputType<TConverter>> extends true
        ? IsAssignable<ConverterOutputType<TConverter>, PropertyType<TTarget, TTargetKey>> extends true
            ? TypeSafeBindingConfig<TSource, TTarget, TSourceKey, TTargetKey, TConverter>
            : {
                __error: `转换器 '${TConverter}' 的输出类型 '${ConverterOutputType<TConverter>}' 不兼容目标属性 '${string & TTargetKey}' 的类型`;
              }
        : {
            __error: `源属性 '${string & TSourceKey}' 的类型不兼容转换器 '${TConverter}' 的输入类型`;
          }
    : // 如果不使用转换器，直接检查源类型是否兼容目标类型
      IsCompatible<PropertyType<TSource, TSourceKey>, PropertyType<TTarget, TTargetKey>> extends true
        ? TypeSafeBindingConfig<TSource, TTarget, TSourceKey, TTargetKey, TConverter>
        : {
            __error: `源属性 '${string & TSourceKey}' 的类型不兼容目标属性 '${string & TTargetKey}' 的类型，请使用合适的转换器`;
          };

/**
 * 类型安全绑定配置 - 应用类型约束
 */
export type SafeBindingConfig<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>,
    TConverter extends ConverterName | undefined = undefined
> = BindingTypeConstraints<TSource, TTarget, TSourceKey, TTargetKey, TConverter> extends {
    __error: any;
}
    ? BindingTypeConstraints<TSource, TTarget, TSourceKey, TTargetKey, TConverter>
    : TypeSafeBindingConfig<TSource, TTarget, TSourceKey, TTargetKey, TConverter>;

/**
 * 绑定选项接口 - 不包含 source 和 target 的配置
 */
export interface BindingOptions {
    /** 绑定类型 */
    type: BindingType;
    /** 绑定模式 */
    mode: BindingMode;
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
 * 验证绑定配置的工具类型
 */
export type ValidateBinding<T> = T extends { __error: infer E }
    ? E extends string
        ? never
        : T
    : T;

/**
 * 提取有效的绑定配置
 */
export type ValidBindingConfig<T> = ValidateBinding<T> extends never
    ? never
    : T extends TypeSafeBindingConfig<any, any, any, any, any>
        ? T
        : never;

/**
 * 类型安全绑定结果
 */
export interface SafeBindingResult {
    /** 绑定ID */
    id: string;
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
}

/**
 * 绑定工厂接口
 */
export interface IBindingFactory {
    /**
     * 创建类型安全的绑定
     */
    createSafeBinding<
        TSource extends object,
        TTarget extends object,
        TSourceKey extends ObservableKeys<TSource>,
        TTargetKey extends WritableKeys<TTarget>,
        TConverter extends ConverterName | undefined = undefined
    >(
        source: TSource,
        target: TTarget,
        config: SafeBindingConfig<TSource, TTarget, TSourceKey, TTargetKey, TConverter>
    ): SafeBindingResult;
}

/**
 * 类型安全的绑定构建器接口
 */
export interface ITypeSafeBindingBuilder<TSource extends object> {
    /**
     * 选择源属性
     */
    property<TKey extends ObservableKeys<TSource>>(key: TKey): IPropertyBindingBuilder<TSource, TKey>;
}

/**
 * 属性绑定构建器接口
 */
export interface IPropertyBindingBuilder<
    TSource extends object,
    TSourceKey extends ObservableKeys<TSource>
> {
    /**
     * 指定目标对象和属性
     */
    to<TTarget extends object, TTargetKey extends WritableKeys<TTarget>>(
        target: TTarget,
        targetKey: TTargetKey
    ): ITargetBindingBuilder<TSource, TTarget, TSourceKey, TTargetKey>;
}

/**
 * 目标绑定构建器接口
 */
export interface ITargetBindingBuilder<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>
> {
    /**
     * 使用转换器
     */
    withConverter<TConverter extends ConverterName>(
        converter: TConverter
    ): IConverterBindingBuilder<TSource, TTarget, TSourceKey, TTargetKey, TConverter>;

    /**
     * 直接绑定（无转换器）
     */
    bind(options: BindingOptions): SafeBindingResult;
}

/**
 * 转换器绑定构建器接口
 */
export interface IConverterBindingBuilder<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>,
    TConverter extends ConverterName
> {
    /**
     * 完成绑定
     */
    bind(options: Omit<BindingOptions, 'converter'>): SafeBindingResult;
}