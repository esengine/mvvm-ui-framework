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