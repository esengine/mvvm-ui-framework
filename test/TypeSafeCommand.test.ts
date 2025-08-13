import { ViewModel } from '../src/core/ViewModel';
import { observable, command, viewModel } from '../src/core/Decorators';

// 测试用的ViewModel类
@viewModel
class TypeSafeTestViewModel extends ViewModel {
    public get name(): string { return 'TypeSafeTestViewModel'; }

    @observable
    public message: string = '';

    @observable
    public count: number = 0;

    // 无参数命令
    @command()
    public resetMessage(): void {
        this.message = '';
    }

    // 单参数命令
    @command()
    public setMessage(msg: string): void {
        this.message = msg;
    }

    // 多参数命令
    @command()
    public updateBoth(newMessage: string, newCount: number): void {
        this.message = newMessage;
        this.count = newCount;
    }

    // 异步命令
    @command({ async: true })
    public async delayedUpdate(msg: string, delay: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, delay));
        this.message = msg;
    }

    // 有返回值的命令
    @command()
    public getFormattedMessage(): string {
        return `Message: ${this.message}`;
    }

    // 有条件的命令
    @command('canReset')
    public conditionalReset(): void {
        this.message = 'reset';
        this.count = 0;
    }

    public canReset(): boolean {
        return this.count > 0;
    }

    // 非命令方法（不应该被类型系统识别）
    private _privateMethod(): void {
        // 私有方法
    }

    public regularMethod(): string {
        return 'not a command';
    }
}

describe('类型安全命令执行', () => {
    let viewModel: TypeSafeTestViewModel;

    beforeEach(() => {
        viewModel = new TypeSafeTestViewModel();
    });

    afterEach(() => {
        viewModel.destroy();
    });

    describe('基础类型安全功能', () => {
        test('无参数命令应该正确执行', () => {
            viewModel.message = 'test';
            
            // 类型安全调用
            viewModel.executeCommand('resetMessage');
            
            expect(viewModel.message).toBe('');
        });

        test('单参数命令应该正确执行', () => {
            // 类型安全调用
            viewModel.executeCommand('setMessage', 'hello');
            
            expect(viewModel.message).toBe('hello');
        });

        test('多参数命令应该正确执行', () => {
            // 类型安全调用
            viewModel.executeCommand('updateBoth', 'hello', 42);
            
            expect(viewModel.message).toBe('hello');
            expect(viewModel.count).toBe(42);
        });

        test('异步命令应该正确执行', async () => {
            // 类型安全调用
            const promise = viewModel.executeCommand('delayedUpdate', 'async message', 10);
            
            expect(promise).toBeInstanceOf(Promise);
            await promise;
            expect(viewModel.message).toBe('async message');
        });

        test('有返回值的命令应该返回正确值', () => {
            viewModel.message = 'test';
            
            // 类型安全调用
            const result = viewModel.executeCommand('getFormattedMessage');
            
            expect(result).toBe('Message: test');
        });
    });

    describe('传统API兼容性', () => {
        test('字符串方式调用应该继续工作', () => {
            // 传统方式调用
            (viewModel as any).executeCommand('setMessage', 'traditional');
            
            expect(viewModel.message).toBe('traditional');
        });

        test('不存在的命令应该给出警告', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            (viewModel as any).executeCommand('nonExistentCommand');
            
            expect(consoleSpy).toHaveBeenCalledWith("命令 'nonExistentCommand' 不存在");
            consoleSpy.mockRestore();
        });
    });

    describe('命令信息和可执行性检查', () => {
        test('应该返回所有可用命令', () => {
            const commands = viewModel.getCommands();
            
            const commandNames = commands.map(c => c.name);
            expect(commandNames).toContain('resetMessage');
            expect(commandNames).toContain('setMessage');
            expect(commandNames).toContain('updateBoth');
            expect(commandNames).toContain('delayedUpdate');
            expect(commandNames).toContain('getFormattedMessage');
            expect(commandNames).toContain('conditionalReset');
        });

        test('应该正确识别命令特征', () => {
            const commands = viewModel.getCommands();
            
            const resetCommand = commands.find(c => c.name === 'resetMessage');
            expect(resetCommand?.hasParameters).toBe(false);
            expect(resetCommand?.parameterCount).toBe(0);
            
            const setCommand = commands.find(c => c.name === 'setMessage');
            expect(setCommand?.hasParameters).toBe(true);
            expect(setCommand?.parameterCount).toBe(1);
            
            const updateCommand = commands.find(c => c.name === 'updateBoth');
            expect(updateCommand?.hasParameters).toBe(true);
            expect(updateCommand?.parameterCount).toBe(2);
        });

        test('canExecuteCommand应该正确工作', () => {
            // 无条件命令
            expect(viewModel.canExecuteCommand('resetMessage')).toBe(true);
            expect(viewModel.canExecuteCommand('setMessage')).toBe(true);
            
            // 条件命令 - 应该调用对应的canReset方法
            viewModel.count = 0;
            expect(viewModel.canExecuteCommand('conditionalReset')).toBe(false); // canReset返回false
            
            viewModel.count = 5;
            expect(viewModel.canExecuteCommand('conditionalReset')).toBe(true); // canReset返回true
            
            // 测试实际的条件逻辑
            viewModel.count = 0;
            expect(viewModel.canReset()).toBe(false);
            viewModel.count = 5;
            expect(viewModel.canReset()).toBe(true);
        });
    });

    describe('类型约束测试', () => {
        // 注意：这些测试主要是为了验证TypeScript编译时的类型检查
        // 在运行时它们仍然会工作，但IDE应该显示类型错误
        
        test('类型系统应该工作', () => {
            // 这些调用在TypeScript中应该有完整的类型支持
            viewModel.executeCommand('resetMessage');
            viewModel.executeCommand('setMessage', 'test');
            viewModel.executeCommand('updateBoth', 'test', 123);
            
            // 验证返回类型
            const result: string = viewModel.executeCommand('getFormattedMessage');
            expect(typeof result).toBe('string');
            
            // 验证Promise返回类型
            const asyncResult: Promise<void> = viewModel.executeCommand('delayedUpdate', 'test', 100);
            expect(asyncResult).toBeInstanceOf(Promise);
        });
    });

    describe('边界情况', () => {
        test('应该处理undefined和null参数', () => {
            // 这些调用在类型系统中可能显示警告，但运行时应该处理
            viewModel.executeCommand('setMessage', undefined as any);
            expect(viewModel.message).toBe(undefined);
            
            viewModel.executeCommand('setMessage', null as any);
            expect(viewModel.message).toBe(null);
        });

        test('应该处理参数数量不匹配', () => {
            // 参数过少
            (viewModel as any).executeCommand('updateBoth', 'only one param');
            expect(viewModel.message).toBe('only one param');
            expect(viewModel.count).toBe(undefined);
            
            // 参数过多 
            (viewModel as any).executeCommand('setMessage', 'param1', 'extra param');
            expect(viewModel.message).toBe('param1');
        });
    });
});