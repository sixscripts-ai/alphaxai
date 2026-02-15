const dataProcessor = require('../src/utils/dataProcessor');

describe('Data Processor', () => {
  describe('inferDataType', () => {
    test('should identify numeric data', () => {
      const values = ['1', '2', '3.5', '100'];
      expect(dataProcessor.inferDataType(values)).toBe('number');
    });

    test('should identify string data', () => {
      const values = ['hello', 'world', 'test'];
      expect(dataProcessor.inferDataType(values)).toBe('string');
    });

    test('should handle empty array', () => {
      expect(dataProcessor.inferDataType([])).toBe('unknown');
    });

    test('should identify date data', () => {
      const values = ['2023-01-01', '2023-12-31', '2024-06-15'];
      expect(dataProcessor.inferDataType(values)).toBe('date');
    });
  });

  describe('analyzeCSVData', () => {
    test('should analyze CSV data structure', () => {
      const data = [
        { name: 'John', age: '25', city: 'New York' },
        { name: 'Jane', age: '30', city: 'Los Angeles' },
        { name: 'Bob', age: '35', city: 'Chicago' }
      ];

      const result = dataProcessor.analyzeCSVData(data);
      
      expect(result.rowCount).toBe(3);
      expect(result.columnCount).toBe(3);
      expect(result.columns).toHaveProperty('name');
      expect(result.columns).toHaveProperty('age');
      expect(result.columns).toHaveProperty('city');
      expect(result.columns.age.type).toBe('number');
    });

    test('should handle empty data', () => {
      const result = dataProcessor.analyzeCSVData([]);
      expect(result).toHaveProperty('error');
    });
  });

  describe('getWordFrequency', () => {
    test('should count word frequency correctly', () => {
      const words = ['hello', 'world', 'hello', 'test', 'world', 'hello'];
      const result = dataProcessor.getWordFrequency(words);
      
      expect(result[0]).toEqual({ word: 'hello', count: 3 });
      expect(result[1]).toEqual({ word: 'world', count: 2 });
      expect(result[2]).toEqual({ word: 'test', count: 1 });
    });

    test('should filter short words', () => {
      const words = ['a', 'an', 'the', 'hello', 'world'];
      const result = dataProcessor.getWordFrequency(words);
      
      expect(result.length).toBe(2);
      expect(result.find(item => item.word === 'a')).toBeUndefined();
      expect(result.find(item => item.word === 'the')).toBeUndefined();
    });
  });

  describe('getJSONStructure', () => {
    test('should analyze simple object structure', () => {
      const obj = { name: 'John', age: 25 };
      const result = dataProcessor.getJSONStructure(obj);
      
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
      expect(result.name).toBe('string');
      expect(result.age).toBe('number');
    });

    test('should analyze array structure', () => {
      const arr = [{ name: 'John' }, { name: 'Jane' }];
      const result = dataProcessor.getJSONStructure(arr);
      
      expect(result.type).toBe('array');
      expect(result.length).toBe(2);
      expect(result.sample).toHaveProperty('name');
    });
  });
});