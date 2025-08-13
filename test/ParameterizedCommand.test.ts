import { ViewModel } from '../src/core/ViewModel';
import { observable, command } from '../src/core/Decorators';

/**
 * 游戏ViewModel示例 - 支持参数化命令
 */
class GameViewModel extends ViewModel {
    public get name(): string { return 'GameViewModel'; }

    @observable
    public score: number = 0;

    @observable
    public level: number = 1;

    @observable
    public playerName: string = '';

    /**
     * 添加分数 - 参数化命令
     */
    @command()
    public addScore(points: number): void {
        this.score += points;
        console.log(`添加 ${points} 分，当前总分: ${this.score}`);
    }

    /**
     * 设置等级 - 参数化命令
     */
    @command({ canExecuteMethod: 'canSetLevel' })
    public setLevel(newLevel: number): void {
        this.level = newLevel;
        console.log(`设置等级为: ${this.level}`);
    }

    /**
     * 检查是否可以设置等级
     */
    public canSetLevel(newLevel: number): boolean {
        return newLevel > 0 && newLevel <= 100;
    }

    /**
     * 重置游戏 - 普通命令（无参数）
     */
    @command()
    public resetGame(): void {
        this.score = 0;
        this.level = 1;
        console.log('游戏已重置');
    }

    /**
     * 设置玩家信息 - 多参数命令
     */
    @command()
    public setPlayerInfo(name: string, initialScore: number = 0): void {
        this.playerName = name;
        this.score = initialScore;
        console.log(`玩家信息设置：${name}, 初始分数: ${initialScore}`);
    }

    /**
     * 异步保存游戏数据 - 异步参数化命令
     */
    @command({ async: true })
    public async saveGameData(saveSlot: number): Promise<void> {
        console.log(`正在保存游戏数据到插槽 ${saveSlot}...`);
        
        // 模拟异步保存操作
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`游戏数据已保存到插槽 ${saveSlot}`);
    }
}

describe('参数化命令测试', () => {
    let gameViewModel: GameViewModel;

    beforeEach(() => {
        gameViewModel = new GameViewModel();
    });

    afterEach(() => {
        gameViewModel.destroy();
    });

    test('应该支持单参数命令执行', () => {
        const initialScore = gameViewModel.score;
        
        // 使用参数执行命令
        gameViewModel.executeCommand('addScore', 100);
        
        expect(gameViewModel.score).toBe(initialScore + 100);
    });

    test('应该支持多参数命令执行', () => {
        // 执行多参数命令
        gameViewModel.executeCommand('setPlayerInfo', 'TestPlayer', 500);
        
        expect(gameViewModel.playerName).toBe('TestPlayer');
        expect(gameViewModel.score).toBe(500);
    });

    test('应该支持带默认参数的命令', () => {
        // 只传入必需参数，可选参数使用默认值
        gameViewModel.executeCommand('setPlayerInfo', 'DefaultPlayer');
        
        expect(gameViewModel.playerName).toBe('DefaultPlayer');
        expect(gameViewModel.score).toBe(0); // 默认值
    });

    test('应该支持canExecute检查带参数', () => {
        // 有效等级
        gameViewModel.executeCommand('setLevel', 5);
        expect(gameViewModel.level).toBe(5);
        
        // 无效等级应该不执行
        const currentLevel = gameViewModel.level;
        gameViewModel.executeCommand('setLevel', -1);
        expect(gameViewModel.level).toBe(currentLevel); // 保持不变
        
        gameViewModel.executeCommand('setLevel', 101);
        expect(gameViewModel.level).toBe(currentLevel); // 保持不变
    });

    test('应该支持无参数命令', () => {
        gameViewModel.score = 1000;
        gameViewModel.level = 10;
        
        gameViewModel.executeCommand('resetGame');
        
        expect(gameViewModel.score).toBe(0);
        expect(gameViewModel.level).toBe(1);
    });

    test('传递参数给无参数命令时应该显示警告', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // 向无参数命令传递参数
        gameViewModel.executeCommand('resetGame', 123, 'extra');
        
        expect(consoleWarnSpy).toHaveBeenCalledWith('命令 resetGame 不支持参数，参数将被忽略');
        
        consoleWarnSpy.mockRestore();
    });

    test('应该支持异步参数化命令', async () => {
        const saveSlot = 3;
        
        // 执行异步命令
        const savePromise = gameViewModel.executeCommand('saveGameData', saveSlot);
        
        // 验证这是一个Promise
        expect(savePromise).toBeUndefined(); // executeCommand本身不返回Promise
        
        // 但我们可以直接测试命令对象
        const command = gameViewModel.getCommand('saveGameData');
        expect(command).toBeDefined();
    });

    test('应该正确处理命令不存在的情况', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // 执行不存在的命令
        gameViewModel.executeCommand('nonExistentCommand', 'param');
        
        // 不应该抛出异常，只是静默忽略
        expect(() => gameViewModel.executeCommand('nonExistentCommand', 'param')).not.toThrow();
        
        consoleWarnSpy.mockRestore();
    });

    test('应该支持手动创建参数化命令', () => {
        let capturedArgs: any[] = [];
        
        // 手动创建参数化命令
        gameViewModel.createParameterizedCommand('testCmd', (...args: any[]) => {
            capturedArgs = args;
        });
        
        // 执行命令
        gameViewModel.executeCommand('testCmd', 'arg1', 42, true);
        
        expect(capturedArgs).toEqual(['arg1', 42, true]);
    });

    test('应该支持手动创建异步参数化命令', async () => {
        let executedWithArgs: any[] = [];
        let executionComplete = false;
        
        // 手动创建异步参数化命令
        gameViewModel.createAsyncParameterizedCommand('asyncTestCmd', async (...args: any[]) => {
            executedWithArgs = args;
            await new Promise(resolve => setTimeout(resolve, 10));
            executionComplete = true;
        });
        
        // 执行命令
        gameViewModel.executeCommand('asyncTestCmd', 'async', 123);
        
        // 立即检查参数
        expect(executedWithArgs).toEqual(['async', 123]);
        
        // 等待异步执行完成
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(executionComplete).toBe(true);
    });
});