import { Observable, createObservable } from '../src/core/Observable';

describe('Observable', () => {
    let observable: Observable;
    let mockObserver: jest.Mock;

    beforeEach(() => {
        observable = new Observable();
        mockObserver = jest.fn();
    });

    afterEach(() => {
        observable.destroy();
    });

    describe('Observer Management', () => {
        test('should add and notify property observer', () => {
            observable.addObserver('test', mockObserver);
            observable.notifyObservers('test', 'newValue', 'oldValue');

            expect(mockObserver).toHaveBeenCalledWith('newValue', 'oldValue', 'test');
        });

        test('should add and notify global observer', () => {
            observable.addObserver(null, mockObserver);
            observable.notifyObservers('anyProperty', 'newValue', 'oldValue');

            expect(mockObserver).toHaveBeenCalledWith('newValue', 'oldValue', 'anyProperty');
        });

        test('should remove specific observer', () => {
            observable.addObserver('test', mockObserver);
            observable.removeObserver('test', mockObserver);
            observable.notifyObservers('test', 'newValue', 'oldValue');

            expect(mockObserver).not.toHaveBeenCalled();
        });

        test('should remove all observers', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            
            observable.addObserver('prop1', observer1);
            observable.addObserver('prop2', observer2);
            observable.removeAllObservers();
            
            observable.notifyObservers('prop1', 'new1', 'old1');
            observable.notifyObservers('prop2', 'new2', 'old2');

            expect(observer1).not.toHaveBeenCalled();
            expect(observer2).not.toHaveBeenCalled();
        });
    });

    describe('Property Management', () => {
        test('should set and get property values', () => {
            (observable as any).setProperty('testProp', 'testValue');
            expect((observable as any).getProperty('testProp')).toBe('testValue');
        });

        test('should notify observers when property changes', () => {
            observable.addObserver('testProp', mockObserver);
            (observable as any).setProperty('testProp', 'newValue');

            expect(mockObserver).toHaveBeenCalledWith('newValue', undefined, 'testProp');
        });

        test('should not notify observers when property value is unchanged', () => {
            (observable as any).setProperty('testProp', 'sameValue');
            observable.addObserver('testProp', mockObserver);
            (observable as any).setProperty('testProp', 'sameValue');

            expect(mockObserver).not.toHaveBeenCalled();
        });
    });

    describe('Batch Updates', () => {
        test('should batch update multiple properties', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            
            observable.addObserver('prop1', observer1);
            observable.addObserver('prop2', observer2);

            observable.batchUpdate({
                prop1: 'value1',
                prop2: 'value2'
            });

            expect(observer1).toHaveBeenCalledWith('value1', undefined, 'prop1');
            expect(observer2).toHaveBeenCalledWith('value2', undefined, 'prop2');
        });

        test('should only notify changed properties in batch update', () => {
            (observable as any).setProperty('prop1', 'unchanged');
            observable.addObserver('prop1', mockObserver);

            observable.batchUpdate({
                prop1: 'unchanged',
                prop2: 'newValue'
            });

            expect(mockObserver).not.toHaveBeenCalled();
        });
    });

    describe('Circular Notification Prevention', () => {
        test('should prevent circular notifications', () => {
            let callCount = 0;
            const circularObserver = jest.fn(() => {
                callCount++;
                if (callCount < 5) { // 防止无限循环
                    observable.notifyObservers('test', 'circular', 'value');
                }
            });

            observable.addObserver('test', circularObserver);
            observable.notifyObservers('test', 'initial', 'old');

            expect(circularObserver).toHaveBeenCalledTimes(1);
        });
    });
});

describe('createObservable', () => {
    test('should create observable proxy object', () => {
        const target = { value: 0 };
        const observableObj = createObservable(target);
        const observer = jest.fn();

        observableObj.addObserver('value', observer);
        observableObj.value = 42;

        expect(observableObj.value).toBe(42);
        expect(observer).toHaveBeenCalledWith(42, 0, 'value');
    });

    test('should handle non-string properties', () => {
        const target = { [Symbol.iterator]: function* () { yield 1; } };
        const observableObj = createObservable(target);

        // 不应该抛出错误
        expect(() => {
            observableObj[Symbol.iterator] = function* () { yield 2; };
        }).not.toThrow();
    });

    test('should provide observable methods through proxy', () => {
        const target = { value: 0 };
        const observableObj = createObservable(target);

        expect(typeof observableObj.addObserver).toBe('function');
        expect(typeof observableObj.removeObserver).toBe('function');
        expect(typeof observableObj.notifyObservers).toBe('function');
        expect(typeof observableObj.removeAllObservers).toBe('function');
    });
});