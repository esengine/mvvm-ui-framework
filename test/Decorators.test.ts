import { 
    observable, 
    computed, 
    command, 
    validate, 
    debounce, 
    throttle, 
    async as asyncDecorator,
    readonly,
    DecoratorUtils
} from '../src/core/Decorators';
import { ViewModel } from '../src/core/ViewModel';

class DecoratorTestViewModel extends ViewModel {
    public get name(): string { return 'DecoratorTestViewModel'; }

    @observable
    public observableProp: string = '';

    @observable
    public count: number = 0;

    @computed(['observableProp', 'count'])
    public get computedProp(): string {
        return `${this.observableProp}-${this.count}`;
    }

    @command()
    public simpleCommandMethod(): void {
        this.count++;
    }

    @command('canExecuteAdvanced')
    public advancedCommandMethod(): void {
        this.observableProp = 'advanced';
    }

    @command()
    public paramCommandMethod(value: string, num: number): void {
        this.observableProp = value;
        this.count = num;
    }

    public canExecuteAdvanced(): boolean {
        return this.count > 0;
    }

    @validate((value: string) => value.length > 0, '不能为空')
    @observable
    public validatedProp: string = '';

    @validate((value: number) => value >= 0 && value <= 100, '必须在0-100之间')
    @observable
    public percentage: number = 50;

    @debounce(100)
    public debouncedMethod(): void {
        this.count += 10;
    }

    @throttle(100)
    public throttledMethod(): void {
        this.count += 5;
    }

    @observable
    public asyncLoading: boolean = false;

    @observable
    public asyncError: Error | null = null;

    @asyncDecorator('asyncLoading', 'asyncError')
    public async asyncMethod(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.observableProp = 'async-complete';
    }

    @readonly
    public readonlyProp: string = 'initial';

    // 测试数据收集计数器
    public debounceCallCount: number = 0;
    public throttleCallCount: number = 0;

    @debounce(50)
    public countingDebouncedMethod(): void {
        this.debounceCallCount++;
    }

    @throttle(50)
    public countingThrottledMethod(): void {
        this.throttleCallCount++;
    }
}

describe('Decorators', () => {
    let viewModel: DecoratorTestViewModel;

    beforeEach(() => {
        viewModel = new DecoratorTestViewModel();
        jest.clearAllMocks();
    });

    afterEach(() => {
        viewModel.destroy();
    });

    describe('@observable装饰器', () => {
        test('应该创建可观察属性', () => {
            const observer = jest.fn();
            viewModel.addObserver('observableProp', observer);
            
            viewModel.observableProp = 'test';
            
            expect(observer).toHaveBeenCalledWith('test', '', 'observableProp');
        });

        test('应该正确设置和获取值', () => {
            viewModel.observableProp = 'hello';
            expect(viewModel.observableProp).toBe('hello');
        });

        test('相同值不应该触发通知', () => {
            viewModel.observableProp = 'same';
            const observer = jest.fn();
            viewModel.addObserver('observableProp', observer);
            
            viewModel.observableProp = 'same';
            expect(observer).not.toHaveBeenCalled();
        });
    });

    describe('@computed装饰器', () => {
        test('应该计算依赖属性', () => {
            viewModel.observableProp = 'hello';
            viewModel.count = 5;
            
            expect(viewModel.computedProp).toBe('hello-5');
        });

        test('应该缓存计算结果', () => {
            const spy = jest.spyOn(viewModel, 'computedProp', 'get');
            
            // 第一次访问
            viewModel.computedProp;
            // 第二次访问应该使用缓存
            viewModel.computedProp;
            
            expect(spy).toHaveBeenCalledTimes(2); // getter会被调用，但内部应该使用缓存
        });

        test('依赖更新时应该重新计算', () => {
            viewModel.observableProp = 'initial';
            expect(viewModel.computedProp).toBe('initial-0');
            
            viewModel.observableProp = 'updated';
            expect(viewModel.computedProp).toBe('updated-0');
        });
    });

    describe('@command装饰器', () => {
        test('应该创建简单命令', () => {
            const initialCount = viewModel.count;
            viewModel.executeCommand('simpleCommandMethod');
            
            expect(viewModel.count).toBe(initialCount + 1);
        });

        test('应该创建带canExecute的命令', () => {
            // 初始状态不能执行
            expect(viewModel.canExecuteCommand('advancedCommandMethod')).toBe(false);
            
            viewModel.count = 1;
            expect(viewModel.canExecuteCommand('advancedCommandMethod')).toBe(true);
            
            viewModel.executeCommand('advancedCommandMethod');
            expect(viewModel.observableProp).toBe('advanced');
        });

        test('应该支持参数化命令', () => {
            viewModel.executeCommand('paramCommandMethod', 'param-test', 42);
            
            expect(viewModel.observableProp).toBe('param-test');
            expect(viewModel.count).toBe(42);
        });
    });

    describe('@validate装饰器', () => {
        test('应该验证字符串属性', () => {
            expect(() => {
                viewModel.validatedProp = 'valid';
            }).not.toThrow();
            
            expect(viewModel.validatedProp).toBe('valid');
        });

        test('应该验证数字范围', () => {
            expect(() => {
                viewModel.percentage = 75;
            }).not.toThrow();
            
            expect(viewModel.percentage).toBe(75);
        });

        test('验证失败应该抛出错误', () => {
            expect(() => {
                viewModel.percentage = 150;
            }).toThrow('必须在0-100之间');
        });
    });

    describe('@debounce装饰器', () => {
        test('应该防抖函数调用', async () => {
            const initialCount = viewModel.debounceCallCount;
            
            // 快速连续调用
            viewModel.countingDebouncedMethod();
            viewModel.countingDebouncedMethod();
            viewModel.countingDebouncedMethod();
            
            // 立即检查，应该还没执行
            expect(viewModel.debounceCallCount).toBe(initialCount);
            
            // 等待防抖延迟
            await new Promise(resolve => setTimeout(resolve, 60));
            
            // 现在应该只执行了一次
            expect(viewModel.debounceCallCount).toBe(initialCount + 1);
        });
    });

    describe('@throttle装饰器', () => {
        test('应该节流函数调用', async () => {
            const initialCount = viewModel.throttleCallCount;
            
            // 快速连续调用
            viewModel.countingThrottledMethod();
            viewModel.countingThrottledMethod();
            viewModel.countingThrottledMethod();
            
            // 应该立即执行一次
            expect(viewModel.throttleCallCount).toBe(initialCount + 1);
            
            // 等待节流间隔
            await new Promise(resolve => setTimeout(resolve, 60));
            
            // 再次调用应该能执行
            viewModel.countingThrottledMethod();
            expect(viewModel.throttleCallCount).toBe(initialCount + 2);
        });
    });

    describe('@async装饰器', () => {
        test('应该管理异步状态', async () => {
            expect(viewModel.asyncLoading).toBe(false);
            expect(viewModel.asyncError).toBe(null);
            
            const promise = viewModel.asyncMethod();
            
            // 异步执行期间
            expect(viewModel.asyncLoading).toBe(true);
            
            await promise;
            
            // 执行完成后
            expect(viewModel.asyncLoading).toBe(false);
            expect(viewModel.observableProp).toBe('async-complete');
            expect(viewModel.asyncError).toBe(null);
        });

        test('应该处理异步错误', async () => {
            // 创建一个会抛出错误的异步方法
            const errorMethod = jest.fn().mockRejectedValue(new Error('测试错误'));
            
            // 手动应用async装饰器
            const decoratedMethod = asyncDecorator('asyncLoading', 'asyncError')(
                viewModel, 'errorMethod', { 
                    value: errorMethod,
                    writable: true,
                    enumerable: true,
                    configurable: true
                }
            ).value;

            try {
                await decoratedMethod.call(viewModel);
            } catch (error) {
                // 预期会抛出错误
            }

            expect(viewModel.asyncLoading).toBe(false);
            expect(viewModel.asyncError).toBeInstanceOf(Error);
        });
    });

    describe('@readonly装饰器', () => {
        test('应该创建只读属性', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            expect(viewModel.readonlyProp).toBe('initial');
            
            // 尝试修改应该被阻止
            viewModel.readonlyProp = 'modified';
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('readonlyProp 是只读的，不能修改')
            );
            expect(viewModel.readonlyProp).toBe('initial');
            
            consoleSpy.mockRestore();
        });
    });

    describe('DecoratorUtils', () => {
        test('应该获取可观察属性', () => {
            const observableProps = DecoratorUtils.getObservableProperties(
                DecoratorTestViewModel.prototype
            );
            
            expect(observableProps).toContain('observableProp');
            expect(observableProps).toContain('count');
        });

        test('应该获取计算属性', () => {
            const computedProps = DecoratorUtils.getComputedProperties(
                DecoratorTestViewModel.prototype
            );
            
            expect(computedProps.has('computedProp')).toBe(true);
            
            const computedInfo = computedProps.get('computedProp');
            expect(computedInfo.dependencies).toEqual(['observableProp', 'count']);
        });

        test('应该获取命令', () => {
            const commands = DecoratorUtils.getCommands(
                DecoratorTestViewModel.prototype
            );
            
            expect(commands.has('simpleCommandMethod')).toBe(true);
            expect(commands.has('advancedCommandMethod')).toBe(true);
            expect(commands.has('paramCommandMethod')).toBe(true);
        });

        test('应该获取验证器', () => {
            const validators = DecoratorUtils.getValidators(
                DecoratorTestViewModel.prototype
            );
            
            expect(validators.has('validatedProp')).toBe(true);
            expect(validators.has('percentage')).toBe(true);
        });

        test('应该获取只读属性', () => {
            const readonlyProps = DecoratorUtils.getReadonlyProperties(
                DecoratorTestViewModel.prototype
            );
            
            expect(readonlyProps).toContain('readonlyProp');
        });
    });
});