import { 
    Command, 
    AsyncCommand, 
    ParameterizedCommand,
    AsyncParameterizedCommand,
    CompositeCommand, 
    CommandHistory,
    ICommand
} from '../src/core/Command';

describe('Command', () => {
    describe('基础Command类', () => {
        test('应该执行简单命令', () => {
            let executed = false;
            const command = new Command(() => {
                executed = true;
            });

            command.execute();
            expect(executed).toBe(true);
        });

        test('应该检查canExecute条件', () => {
            let canExec = false;
            const command = new Command(
                () => {},
                () => canExec
            );

            expect(command.canExecute()).toBe(false);
            command.execute();
            
            canExec = true;
            expect(command.canExecute()).toBe(true);
        });

        test('canExecute为false时不应该执行', () => {
            let executed = false;
            const command = new Command(
                () => { executed = true; },
                () => false
            );

            command.execute();
            expect(executed).toBe(false);
        });

        test('应该支持撤销操作', () => {
            let value = 0;
            const command = new Command(
                () => { value = 10; },
                () => true,
                () => { value = 0; }
            );

            command.execute();
            expect(value).toBe(10);

            command.undo();
            expect(value).toBe(0);
        });

        test('应该支持重做操作', () => {
            let value = 0;
            const command = new Command(
                () => { value += 5; },
                () => true,
                () => { value -= 5; },
                () => { value += 5; }
            );

            command.execute();
            expect(value).toBe(5);

            command.undo();
            expect(value).toBe(0);

            command.redo();
            expect(value).toBe(5);
        });

        test('应该正确报告撤销和重做能力', () => {
            const commandWithUndo = new Command(() => {}, () => true, () => {});
            expect(commandWithUndo.canUndo).toBe(true);
            expect(commandWithUndo.canRedo).toBe(true);

            const commandWithoutUndo = new Command(() => {}, () => true);
            expect(commandWithoutUndo.canUndo).toBe(false);
            expect(commandWithoutUndo.canRedo).toBe(true);
        });
    });

    describe('AsyncCommand类', () => {
        test('应该异步执行命令', async () => {
            let executed = false;
            const command = new AsyncCommand(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                executed = true;
            });

            await command.executeAsync();
            expect(executed).toBe(true);
        });

        test('执行期间应该报告正在执行状态', async () => {
            const command = new AsyncCommand(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            expect(command.isExecuting()).toBe(false);
            
            const promise = command.executeAsync();
            expect(command.isExecuting()).toBe(true);
            
            await promise;
            expect(command.isExecuting()).toBe(false);
        });

        test('执行期间canExecute应该返回false', async () => {
            const command = new AsyncCommand(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            const promise = command.executeAsync();
            expect(command.canExecute()).toBe(false);
            
            await promise;
            expect(command.canExecute()).toBe(true);
        });

        test('canExecute为false时不应该执行', async () => {
            let executed = false;
            const command = new AsyncCommand(
                async () => { executed = true; },
                () => false
            );

            await command.executeAsync();
            expect(executed).toBe(false);
        });
    });

    describe('ParameterizedCommand类', () => {
        test('应该执行带参数的命令', () => {
            let result: any[] = [];
            const command = new ParameterizedCommand((...args: any[]) => {
                result = args;
            });

            command.execute('test', 123, true);
            expect(result).toEqual(['test', 123, true]);
        });

        test('应该支持参数化的canExecute检查', () => {
            const command = new ParameterizedCommand(
                () => {},
                (value: number) => value > 0
            );

            expect(command.canExecute(-1)).toBe(false);
            expect(command.canExecute(1)).toBe(true);
        });

        test('canExecute失败时不应该执行', () => {
            let executed = false;
            const command = new ParameterizedCommand(
                () => { executed = true; },
                () => false
            );

            command.execute('any', 'args');
            expect(executed).toBe(false);
        });

        test('应该支持参数化的撤销和重做', () => {
            let value = 0;
            const command = new ParameterizedCommand(
                (amount: number) => { value += amount; },
                () => true,
                (amount: number) => { value -= amount; },
                (amount: number) => { value += amount; }
            );

            command.execute(10);
            expect(value).toBe(10);

            command.undo(10);
            expect(value).toBe(0);

            command.redo(10);
            expect(value).toBe(10);
        });
    });

    describe('AsyncParameterizedCommand类', () => {
        test('应该异步执行带参数的命令', async () => {
            let result: any[] = [];
            const command = new AsyncParameterizedCommand(async (...args: any[]) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                result = args;
            });

            await command.executeAsync('async', 456, false);
            expect(result).toEqual(['async', 456, false]);
        });

        test('应该支持同步execute接口', () => {
            let result: any[] = [];
            const command = new AsyncParameterizedCommand(async (...args: any[]) => {
                result = args;
            });

            // 同步调用不会等待，但会触发异步执行
            command.execute('sync', 789);
            
            // 等待一个tick让异步执行完成
            return new Promise(resolve => {
                setTimeout(() => {
                    expect(result).toEqual(['sync', 789]);
                    resolve(undefined);
                }, 10);
            });
        });

        test('应该支持参数化的canExecute检查', () => {
            const command = new AsyncParameterizedCommand(
                async () => {},
                (min: number, max: number) => min < max
            );

            expect(command.canExecute(5, 3)).toBe(false);
            expect(command.canExecute(3, 5)).toBe(true);
        });

        test('执行期间应该阻止重复执行', async () => {
            let executeCount = 0;
            const command = new AsyncParameterizedCommand(async () => {
                executeCount++;
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            // 同时开始两个执行
            const promise1 = command.executeAsync('test1');
            const promise2 = command.executeAsync('test2');

            await Promise.all([promise1, promise2]);
            
            // 只应该执行一次
            expect(executeCount).toBe(1);
        });

        test('应该处理异步执行错误', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const command = new AsyncParameterizedCommand(async () => {
                throw new Error('Test error');
            });

            // 使用execute接口，现在会返回Promise并重新抛出错误
            await expect(command.execute('error-test')).rejects.toThrow('Test error');
            
            // 验证错误日志被记录
            expect(consoleSpy).toHaveBeenCalledWith(
                '异步命令执行出错:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('CompositeCommand类', () => {
        test('应该执行所有子命令', () => {
            let results: string[] = [];
            const command1 = new Command(() => results.push('cmd1'));
            const command2 = new Command(() => results.push('cmd2'));
            const command3 = new Command(() => results.push('cmd3'));

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command2);
            composite.addCommand(command3);

            composite.execute();
            expect(results).toEqual(['cmd1', 'cmd2', 'cmd3']);
        });

        test('应该跳过无法执行的命令', () => {
            let results: string[] = [];
            const command1 = new Command(() => results.push('cmd1'), () => true);
            const command2 = new Command(() => results.push('cmd2'), () => false);
            const command3 = new Command(() => results.push('cmd3'), () => true);

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command2);
            composite.addCommand(command3);

            composite.execute();
            expect(results).toEqual(['cmd1', 'cmd3']);
        });

        test('所有命令都可执行时canExecute才返回true', () => {
            const command1 = new Command(() => {}, () => true);
            const command2 = new Command(() => {}, () => false);
            const command3 = new Command(() => {}, () => true);

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command3);
            expect(composite.canExecute()).toBe(true);

            composite.addCommand(command2);
            expect(composite.canExecute()).toBe(false);
        });

        test('应该支持添加和移除命令', () => {
            const command1 = new Command(() => {});
            const command2 = new Command(() => {});

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command2);

            composite.removeCommand(command1);

            let executed = false;
            const command3 = new Command(() => { executed = true; });
            composite.addCommand(command3);

            composite.execute();
            expect(executed).toBe(true);
        });

        test('应该支持清空所有命令', () => {
            const command1 = new Command(() => {});
            const command2 = new Command(() => {});

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command2);

            composite.clear();
            expect(composite.canExecute()).toBe(true); // 空的复合命令应该可以执行
        });

        test('应该逆序撤销命令', () => {
            let results: string[] = [];
            const command1 = new Command(
                () => results.push('exec1'),
                () => true,
                () => results.push('undo1')
            );
            const command2 = new Command(
                () => results.push('exec2'),
                () => true,
                () => results.push('undo2')
            );

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command2);

            composite.execute();
            expect(results).toEqual(['exec1', 'exec2']);

            results.length = 0;
            composite.undo();
            expect(results).toEqual(['undo2', 'undo1']);
        });

        test('应该支持重做所有命令', () => {
            let results: string[] = [];
            const command1 = new Command(
                () => results.push('exec1'),
                () => true,
                () => {},
                () => results.push('redo1')
            );
            const command2 = new Command(
                () => results.push('exec2'),
                () => true,
                () => {},
                () => results.push('redo2')
            );

            const composite = new CompositeCommand();
            composite.addCommand(command1);
            composite.addCommand(command2);

            composite.redo();
            expect(results).toEqual(['redo1', 'redo2']);
        });
    });

    describe('CommandHistory类', () => {
        let history: CommandHistory;

        beforeEach(() => {
            history = new CommandHistory();
        });

        test('应该执行并记录命令', () => {
            let executed = false;
            const command = new Command(() => { executed = true; });

            history.executeCommand(command);
            
            expect(executed).toBe(true);
            expect(history.historySize).toBe(1);
        });

        test('应该支持撤销操作', () => {
            let value = 0;
            const command = new Command(
                () => { value = 10; },
                () => true,
                () => { value = 0; }
            );

            history.executeCommand(command);
            expect(value).toBe(10);

            history.undo();
            expect(value).toBe(0);
        });

        test('应该支持重做操作', () => {
            let value = 0;
            const command = new Command(
                () => { value = 10; },
                () => true,
                () => { value = 0; },
                () => { value = 10; }
            );

            history.executeCommand(command);
            history.undo();
            expect(value).toBe(0);

            history.redo();
            expect(value).toBe(10);
        });

        test('应该正确报告撤销和重做能力', () => {
            const command = new Command(
                () => {},
                () => true,
                () => {}
            );

            expect(history.canUndo()).toBe(false);
            expect(history.canRedo()).toBe(false);

            history.executeCommand(command);
            expect(history.canUndo()).toBe(true);
            expect(history.canRedo()).toBe(false);

            history.undo();
            expect(history.canUndo()).toBe(false);
            expect(history.canRedo()).toBe(true);
        });

        test('新命令应该清除重做历史', () => {
            const command1 = new Command(() => {}, () => true, () => {});
            const command2 = new Command(() => {}, () => true, () => {});

            history.executeCommand(command1);
            history.undo();
            expect(history.canRedo()).toBe(true);

            history.executeCommand(command2);
            expect(history.canRedo()).toBe(false);
        });

        test('应该限制历史大小', () => {
            history.maxHistorySize = 3;

            for (let i = 0; i < 5; i++) {
                const command = new Command(() => {});
                history.executeCommand(command);
            }

            expect(history.historySize).toBe(3);
        });

        test('应该支持清空历史', () => {
            const command = new Command(() => {});
            history.executeCommand(command);
            expect(history.historySize).toBe(1);

            history.clear();
            expect(history.historySize).toBe(0);
            expect(history.canUndo()).toBe(false);
            expect(history.canRedo()).toBe(false);
        });

        test('应该支持设置最大历史大小', () => {
            // 先添加一些历史
            for (let i = 0; i < 5; i++) {
                const command = new Command(() => {});
                history.executeCommand(command);
            }
            expect(history.historySize).toBe(5);

            // 设置较小的最大大小
            history.maxHistorySize = 3;
            expect(history.historySize).toBe(3);
            expect(history.maxHistorySize).toBe(3);
        });

        test('不应该记录无法执行的命令', () => {
            const command = new Command(() => {}, () => false);
            
            history.executeCommand(command);
            expect(history.historySize).toBe(0);
        });
    });

    describe('接口兼容性', () => {
        test('ParameterizedCommand应该实现ICommand接口', () => {
            const command: ICommand = new ParameterizedCommand(() => {});
            
            expect(typeof command.execute).toBe('function');
            expect(typeof command.canExecute).toBe('function');
        });

        test('AsyncParameterizedCommand应该实现ICommand接口', () => {
            const command: ICommand = new AsyncParameterizedCommand(async () => {});
            
            expect(typeof command.execute).toBe('function');
            expect(typeof command.canExecute).toBe('function');
        });

        test('所有命令类都应该有正确的接口', () => {
            const commands: ICommand[] = [
                new Command(() => {}),
                new AsyncCommand(async () => {}),
                new ParameterizedCommand(() => {}),
                new AsyncParameterizedCommand(async () => {}),
                new CompositeCommand()
            ];

            commands.forEach(command => {
                expect(typeof command.execute).toBe('function');
                expect(typeof command.canExecute).toBe('function');
            });
        });
    });
});