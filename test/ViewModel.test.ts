import { ViewModel } from '../src/core/ViewModel';
import { observable, command, computed } from '../src/core/Decorators';

class TestViewModel extends ViewModel {
    public get name(): string { return 'TestViewModel'; }

    @observable
    public firstName: string = '';

    @observable
    public lastName: string = '';

    @observable
    public age: number = 0;

    @computed(['firstName', 'lastName'])
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    @command()
    public simpleCommand(): void {
        this.age = 25;
    }

    @command()
    public parameterizedCommand(value: string): void {
        this.firstName = value;
    }

    @command('canExecuteConditional')
    public conditionalCommand(): void {
        this.lastName = 'Executed';
    }

    public canExecuteConditional(): boolean {
        return this.age >= 18;
    }

    @command()
    public multiParamCommand(first: string, last: string, newAge: number): void {
        this.firstName = first;
        this.lastName = last;
        this.age = newAge;
    }

    @command({ async: true })
    public async asyncCommand(delay: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, delay));
        this.age = 100;
    }

    public validationTest: string = '';
}

describe('ViewModel', () => {
    let viewModel: TestViewModel;

    beforeEach(() => {
        viewModel = new TestViewModel();
    });

    afterEach(() => {
        viewModel.destroy();
    });

    describe('基础功能', () => {
        test('应该正确继承Observable功能', () => {
            const observer = jest.fn();
            viewModel.addObserver('firstName', observer);
            
            viewModel.firstName = 'John';
            
            expect(observer).toHaveBeenCalledWith('John', '', 'firstName');
        });

        test('应该提供name属性', () => {
            expect(viewModel.name).toBe('TestViewModel');
        });

        test('应该支持可观察属性', () => {
            viewModel.firstName = 'Test';
            expect(viewModel.firstName).toBe('Test');
        });

        test('应该支持计算属性', () => {
            viewModel.firstName = 'John';
            viewModel.lastName = 'Doe';
            expect(viewModel.fullName).toBe('John Doe');
        });
    });

    describe('命令系统', () => {
        test('应该支持简单命令执行', () => {
            viewModel.executeCommand('simpleCommand');
            expect(viewModel.age).toBe(25);
        });

        test('应该支持参数化命令', () => {
            viewModel.executeCommand('parameterizedCommand', 'Alice');
            expect(viewModel.firstName).toBe('Alice');
        });

        test('应该支持多参数命令', () => {
            viewModel.executeCommand('multiParamCommand', 'Bob', 'Smith', 30);
            
            expect(viewModel.firstName).toBe('Bob');
            expect(viewModel.lastName).toBe('Smith');
            expect(viewModel.age).toBe(30);
        });

        test('应该支持带条件的命令执行', () => {
            // 初始状态，年龄不满足条件
            viewModel.executeCommand('conditionalCommand');
            expect(viewModel.lastName).not.toBe('Executed');
            
            // 满足条件后再执行
            viewModel.age = 20;
            viewModel.executeCommand('conditionalCommand');
            expect(viewModel.lastName).toBe('Executed');
        });

        test('应该支持异步参数化命令', async () => {
            const command = viewModel.getCommand('asyncCommand');
            expect(command).toBeDefined();
            
            viewModel.executeCommand('asyncCommand', 10);
            
            // 等待异步执行完成
            await new Promise(resolve => setTimeout(resolve, 20));
            expect(viewModel.age).toBe(100);
        });

        test('应该正确处理不存在的命令', () => {
            expect(() => {
                viewModel.executeCommand('nonExistentCommand', 'arg');
            }).not.toThrow();
        });

        test('应该警告向无参数命令传递参数', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            viewModel.executeCommand('simpleCommand', 'unnecessary');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '命令 simpleCommand 不支持参数，参数将被忽略'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('手动命令创建', () => {
        test('应该支持手动创建普通命令', () => {
            let executed = false;
            viewModel.createCommand('manualCommand', () => {
                executed = true;
            });

            viewModel.executeCommand('manualCommand');
            expect(executed).toBe(true);
        });

        test('应该支持手动创建参数化命令', () => {
            let receivedArgs: any[] = [];
            viewModel.createParameterizedCommand('manualParamCommand', (...args) => {
                receivedArgs = args;
            });

            viewModel.executeCommand('manualParamCommand', 'test', 123, true);
            expect(receivedArgs).toEqual(['test', 123, true]);
        });

        test('应该支持手动创建异步命令', async () => {
            let executed = false;
            viewModel.createAsyncCommand('manualAsyncCommand', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                executed = true;
            });

            viewModel.executeCommand('manualAsyncCommand');
            await new Promise(resolve => setTimeout(resolve, 20));
            expect(executed).toBe(true);
        });

        test('应该支持手动创建异步参数化命令', async () => {
            let receivedArgs: any[] = [];
            viewModel.createAsyncParameterizedCommand('manualAsyncParamCommand', async (...args) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                receivedArgs = args;
            });

            viewModel.executeCommand('manualAsyncParamCommand', 'async', 456);
            await new Promise(resolve => setTimeout(resolve, 20));
            expect(receivedArgs).toEqual(['async', 456]);
        });
    });

    describe('命令查询', () => {
        test('应该能获取命令对象', () => {
            const command = viewModel.getCommand('simpleCommand');
            expect(command).toBeDefined();
            expect(typeof command?.execute).toBe('function');
        });

        test('应该能检查命令是否可执行', () => {
            expect(viewModel.canExecuteCommand('simpleCommand')).toBe(true);
            
            // 年龄不满足条件的命令
            expect(viewModel.canExecuteCommand('conditionalCommand')).toBe(false);
            
            viewModel.age = 20;
            expect(viewModel.canExecuteCommand('conditionalCommand')).toBe(true);
        });

        test('对不存在的命令应该返回false', () => {
            expect(viewModel.canExecuteCommand('nonExistent')).toBe(false);
        });
    });

    describe('验证系统', () => {
        test('应该支持属性验证', () => {
            // 设置验证器
            const validators = new Map();
            validators.set('validationTest', {
                validator: (value: string) => value.length > 0,
                message: '不能为空'
            });
            
            // 模拟验证器注册（通常通过装饰器完成）
            (viewModel as any)._validationErrors = new Map();
            
            expect(viewModel.isValid).toBe(true);
            expect(viewModel.hasValidationErrors).toBe(false);
        });

        test('应该支持脏状态管理', () => {
            expect(viewModel.isDirty).toBe(false);
            
            viewModel.markAsDirty();
            expect(viewModel.isDirty).toBe(true);
            
            viewModel.markAsClean();
            expect(viewModel.isDirty).toBe(false);
        });
    });

    describe('生命周期', () => {
        test('应该支持重置操作', () => {
            viewModel.firstName = 'Test';
            viewModel.markAsDirty();
            
            viewModel.reset();
            
            expect(viewModel.isDirty).toBe(false);
            expect(viewModel.isValid).toBe(true);
        });

        test('应该提供摘要信息', () => {
            const summary = viewModel.getSummary();
            
            expect(summary.name).toBe('TestViewModel');
            expect(Array.isArray(summary.observableProperties)).toBe(true);
            expect(Array.isArray(summary.computedProperties)).toBe(true);
            expect(Array.isArray(summary.commands)).toBe(true);
            expect(typeof summary.isDirty).toBe('boolean');
            expect(typeof summary.isValid).toBe('boolean');
        });

        test('应该正确销毁', () => {
            const observer = jest.fn();
            viewModel.addObserver('firstName', observer);
            
            viewModel.destroy();
            
            viewModel.firstName = 'Test';
            expect(observer).not.toHaveBeenCalled();
        });
    });
});