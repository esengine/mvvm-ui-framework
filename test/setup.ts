import 'reflect-metadata';

// Jest测试环境设置
global.console = {
    ...console,
    // 静默一些不必要的控制台输出
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};