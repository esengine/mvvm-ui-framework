// 基础功能测试 - 不依赖装饰器
import { Observable } from '../src/core/Observable';
import { ViewModel } from '../src/core/ViewModel';
import { Command, ParameterizedCommand } from '../src/core/Command';

// 简单的测试ViewModel，不使用装饰器
class SimpleTestViewModel extends ViewModel {
    public get name(): string { return 'SimpleTestViewModel'; }
    
    private _value: string = '';
    
    public get value(): string {
        return this._value;
    }
    
    public set value(newValue: string) {
        const oldValue = this._value;
        this._value = newValue;
        this.notifyObservers('value', newValue, oldValue);
    }
}

describe('基础功能测试', () => {
    describe('Observable基础', () => {
        test('应该支持属性观察', () => {
            const observable = new Observable();
            const observer = jest.fn();
            
            observable.addObserver('test', observer);
            observable.notifyObservers('test', 'newValue', 'oldValue');
            
            expect(observer).toHaveBeenCalledWith('newValue', 'oldValue', 'test');
        });
    });

    describe('ViewModel基础', () => {
        test('应该创建ViewModel实例', () => {
            const vm = new SimpleTestViewModel();
            expect(vm.name).toBe('SimpleTestViewModel');
            vm.destroy();
        });

        test('应该支持属性变化通知', () => {
            const vm = new SimpleTestViewModel();
            const observer = jest.fn();
            
            vm.addObserver('value', observer);
            vm.value = 'test';
            
            expect(observer).toHaveBeenCalledWith('test', '', 'value');
            vm.destroy();
        });

        test('应该支持手动创建命令', () => {
            const vm = new SimpleTestViewModel();
            let executed = false;
            
            vm.createCommand('testCommand', () => {
                executed = true;
            });
            
            vm.executeCommand('testCommand');
            expect(executed).toBe(true);
            vm.destroy();
        });

        test('应该支持参数化命令', () => {
            const vm = new SimpleTestViewModel();
            let receivedArgs: any[] = [];
            
            vm.createParameterizedCommand('paramCommand', (...args: any[]) => {
                receivedArgs = args;
            });
            
            vm.executeCommand('paramCommand', 'arg1', 42, true);
            expect(receivedArgs).toEqual(['arg1', 42, true]);
            vm.destroy();
        });
    });

    describe('Command基础', () => {
        test('应该执行基础命令', () => {
            let executed = false;
            const cmd = new Command(() => { executed = true; });
            
            cmd.execute();
            expect(executed).toBe(true);
        });

        test('应该执行参数化命令', () => {
            let result: any[] = [];
            const cmd = new ParameterizedCommand((...args: any[]) => {
                result = args;
            });
            
            cmd.execute('test', 123);
            expect(result).toEqual(['test', 123]);
        });

        test('应该检查canExecute条件', () => {
            const cmd = new Command(
                () => {},
                () => false
            );
            
            expect(cmd.canExecute()).toBe(false);
        });
    });

    describe('基础集成', () => {
        test('ViewModel应该能管理命令', () => {
            const vm = new SimpleTestViewModel();
            
            vm.createCommand('setValue', () => {
                vm.value = 'command set';
            });
            
            vm.executeCommand('setValue');
            expect(vm.value).toBe('command set');
            vm.destroy();
        });
    });
});