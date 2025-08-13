/**
 * TypeScript 类型工具
 * 提供高级类型操作和命令类型安全支持
 */

/**
 * 提取对象中所有方法名的联合类型
 */
export type MethodNames<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * 提取被@command装饰器标记的方法名
 * 通过方法名称模式匹配来识别命令方法
 */
export type CommandMethods<T> = {
    [K in keyof T]: K extends string 
        ? T[K] extends (...args: any[]) => any 
            ? K
            : never
        : never;
}[keyof T];

/**
 * 获取方法的参数类型
 */
export type CommandParameters<T, K extends keyof T> = 
    T[K] extends (...args: infer P) => any ? P : never;

/**
 * 获取方法的返回类型
 */
export type CommandReturnType<T, K extends keyof T> = 
    T[K] extends (...args: any[]) => infer R ? R : never;

/**
 * 检查方法是否为异步方法
 */
export type IsAsyncCommand<T, K extends keyof T> = 
    T[K] extends (...args: any[]) => Promise<any> ? true : false;

/**
 * 提取所有无参数的命令方法
 */
export type NoParamCommands<T> = {
    [K in keyof T]: T[K] extends () => any ? K : never;
}[keyof T];

/**
 * 提取所有有参数的命令方法
 */
export type ParamCommands<T> = {
    [K in keyof T]: T[K] extends (arg1: any, ...args: any[]) => any ? K : never;
}[keyof T];

/**
 * 命令执行选项
 */
export interface CommandExecuteOptions {
    /** 是否等待异步命令完成 */
    await?: boolean;
    /** 执行前的回调 */
    beforeExecute?: (commandName: string, args: any[]) => void;
    /** 执行后的回调 */
    afterExecute?: (commandName: string, result: any, error?: Error) => void;
}

/**
 * 命令信息接口
 */
export interface CommandInfo {
    /** 命令名称 */
    name: string;
    /** 是否有参数 */
    hasParameters: boolean;
    /** 是否异步 */
    isAsync: boolean;
    /** 参数数量 */
    parameterCount: number;
    /** 是否可执行 */
    canExecute?: boolean;
}

/**
 * 类型安全的命令执行器接口
 */
export interface TypeSafeCommandExecutor<T> {
    /**
     * 执行无参数命令
     */
    executeCommand<K extends NoParamCommands<T>>(name: K): CommandReturnType<T, K>;
    
    /**
     * 执行有参数命令
     */
    executeCommand<K extends ParamCommands<T>>(
        name: K, 
        ...args: CommandParameters<T, K>
    ): CommandReturnType<T, K>;
    
    /**
     * 获取所有可用命令的信息
     */
    getCommands(): CommandInfo[];
    
    /**
     * 检查命令是否可执行
     */
    canExecuteCommand<K extends CommandMethods<T>>(name: K): boolean;
}

/**
 * 工具类型：提取字符串字面量类型
 */
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

/**
 * 工具类型：排除Function类型的方法
 */
export type NonFunctionKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 工具类型：只保留Function类型的方法
 */
export type FunctionKeys<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

/**
 * 命令方法过滤器类型
 * 过滤掉内置方法和私有方法
 */
export type FilteredCommandMethods<T> = {
    [K in keyof T]: K extends string
        ? K extends `_${string}` | 'constructor' | 'toString' | 'valueOf' | 'hasOwnProperty' 
            | 'isPrototypeOf' | 'propertyIsEnumerable' | 'toLocaleString' | 'name'
            | 'destroy' | 'addObserver' | 'removeObserver' | 'notifyObservers'
            | 'setProperty' | 'getProperty' | 'markAsDirty' | 'markAsClean'
            ? never
            : T[K] extends (...args: any[]) => any
                ? K
                : never
        : never;
}[keyof T];

/**
 * 命令重载类型定义
 */
export type CommandOverloads<T> = {
    [K in FilteredCommandMethods<T>]: T[K] extends (...args: infer P) => infer R
        ? P extends []
            ? () => R
            : (...args: P) => R
        : never;
};

/**
 * ===== 绑定相关类型工具 =====
 */

/**
 * 提取对象中所有非函数属性名（用于绑定的源属性）
 */
export type BindableKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 提取对象中所有可写入的属性名（用于绑定的目标属性）
 */
export type WritableKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * 获取属性的类型
 */
export type PropertyType<T, K extends keyof T> = T[K];

/**
 * 检查类型A是否可以赋值给类型B
 */
export type IsAssignable<A, B> = A extends B ? true : false;

/**
 * 检查两个类型是否兼容（互相可赋值或有公共基类型）
 */
export type IsCompatible<A, B> = 
    IsAssignable<A, B> extends true 
        ? true 
        : IsAssignable<B, A> extends true 
            ? true 
            : A extends string | number | boolean 
                ? B extends string | number | boolean 
                    ? true 
                    : false
                : false;

/**
 * 属性路径类型 - 支持嵌套属性访问如 'user.profile.name'
 */
export type PropertyPath<T> = {
    [K in keyof T]: K extends string
        ? T[K] extends object
            ? T[K] extends Function
                ? K
                : K | `${K}.${PropertyPath<T[K]>}`
            : K
        : never;
}[keyof T];

/**
 * 根据属性路径字符串获取对应的类型
 */
export type PropertyByPath<T, P extends string> = 
    P extends `${infer Key}.${infer Rest}`
        ? Key extends keyof T
            ? PropertyByPath<T[Key], Rest>
            : never
        : P extends keyof T
            ? T[P]
            : never;

/**
 * 绑定类型验证 - 确保源类型和目标类型兼容
 */
export type ValidateBindingTypes<TSource, TTarget> = 
    IsCompatible<TSource, TTarget> extends true
        ? true
        : {
            __error: string;
          };

/**
 * 转换器类型映射接口
 */
export interface ConverterTypeInfo<TInput = any, TOutput = any> {
    input: TInput;
    output: TOutput;
}

/**
 * 绑定表达式解析
 */
export type ParseBindingExpression<T extends string> = 
    T extends `${infer Prop} | ${infer Converter}`
        ? {
            property: Prop;
            converter: Converter;
          }
        : {
            property: T;
            converter: never;
          };

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object 
        ? T[P] extends Function 
            ? T[P]
            : DeepReadonly<T[P]>
        : T[P];
};

/**
 * 深度可选类型
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object 
        ? T[P] extends Function 
            ? T[P]
            : DeepPartial<T[P]>
        : T[P];
};

/**
 * 提取Promise的类型
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * 函数参数类型提取
 */
export type FunctionParameters<T> = T extends (...args: infer P) => any ? P : never;

/**
 * 函数返回类型提取
 */
export type FunctionReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * 排除undefined的类型
 */
export type NonUndefined<T> = T extends undefined ? never : T;

/**
 * 排除null的类型
 */
export type NonNull<T> = T extends null ? never : T;

/**
 * 排除null和undefined的类型
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 绑定配置验证器
 */
export interface BindingConfigValidator<TSource, TTarget> {
    validateSource(source: TSource): boolean;
    validateTarget(target: TTarget): boolean;
    validateCompatibility(source: TSource, target: TTarget): boolean;
}

/**
 * 类型安全的绑定工厂
 */
export interface TypeSafeBindingFactory {
    createBinding<
        TSource extends object,
        TTarget extends object,
        TSourceKey extends BindableKeys<TSource>,
        TTargetKey extends WritableKeys<TTarget>
    >(
        source: TSource,
        target: TTarget,
        sourceKey: TSourceKey,
        targetKey: TTargetKey
    ): boolean;
}

/**
 * 绑定元数据
 */
export interface BindingMetadata {
    sourceType: string;
    targetType: string;
    converterName?: string;
    isCompatible: boolean;
    createdAt: Date;
}

/**
 * 类型安全工具函数集合
 */
export namespace TypeSafeUtils {
    /**
     * 检查对象是否具有指定属性
     */
    export function hasProperty<T extends object, K extends keyof T>(
        obj: T | null | undefined,
        key: K
    ): obj is T & Record<K, NonNullable<T[K]>> {
        return obj != null && key in obj && obj[key] != null;
    }

    /**
     * 安全获取属性值
     */
    export function getProperty<T, K extends keyof T>(
        obj: T | null | undefined,
        key: K
    ): T[K] | undefined {
        return obj?.[key];
    }

    /**
     * 安全设置属性值
     */
    export function setProperty<T extends object, K extends keyof T>(
        obj: T | null | undefined,
        key: K,
        value: T[K]
    ): void {
        if (obj != null) {
            (obj as T)[key] = value;
        }
    }
}