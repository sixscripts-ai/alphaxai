const fs = require('fs');
const csv = require('csv-parser');
const logger = require('./logger');

class DataProcessor {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'txt'];
  }

  async processCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const metadata = {
        columns: [],
        rowCount: 0,
        sampleData: []
      };

      fs.createReadStream(filePath)
        .pipe(csv(options))
        .on('headers', (headers) => {
          metadata.columns = headers;
        })
        .on('data', (data) => {
          metadata.rowCount++;
          if (metadata.sampleData.length < 10) {
            metadata.sampleData.push(data);
          }
          results.push(data);
        })
        .on('end', () => {
          resolve({ data: results, metadata });
        })
        .on('error', (error) => {
          logger.error('CSV processing error:', error);
          reject(error);
        });
    });
  }

  async processJSON(filePath) {
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      const metadata = {
        type: Array.isArray(data) ? 'array' : 'object',
        keys: Array.isArray(data) ? Object.keys(data[0] || {}) : Object.keys(data),
        itemCount: Array.isArray(data) ? data.length : 1
      };

      return { data, metadata };
    } catch (error) {
      logger.error('JSON processing error:', error);
      throw error;
    }
  }

  async processText(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const metadata = {
        lineCount: lines.length,
        characterCount: content.length,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length
      };

      return { data: { content, lines }, metadata };
    } catch (error) {
      logger.error('Text processing error:', error);
      throw error;
    }
  }

  async analyzeData(data, type) {
    const analysis = {
      type,
      summary: {},
      insights: []
    };

    switch (type) {
    case 'csv':
      analysis.summary = this.analyzeCSVData(data);
      break;
    case 'json':
      analysis.summary = this.analyzeJSONData(data);
      break;
    case 'text':
      analysis.summary = this.analyzeTextData(data);
      break;
    }

    return analysis;
  }

  analyzeCSVData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { error: 'No data to analyze' };
    }

    const columns = Object.keys(data[0]);
    const columnStats = {};

    columns.forEach(column => {
      const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
      
      columnStats[column] = {
        type: this.inferDataType(values),
        nullCount: data.length - values.length,
        uniqueCount: new Set(values).size,
        sampleValues: values.slice(0, 5)
      };

      // Numeric statistics
      if (columnStats[column].type === 'number') {
        const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
        if (numericValues.length > 0) {
          columnStats[column].min = Math.min(...numericValues);
          columnStats[column].max = Math.max(...numericValues);
          columnStats[column].mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        }
      }
    });

    return {
      rowCount: data.length,
      columnCount: columns.length,
      columns: columnStats
    };
  }

  analyzeJSONData(data) {
    return {
      type: Array.isArray(data) ? 'array' : 'object',
      itemCount: Array.isArray(data) ? data.length : 1,
      structure: this.getJSONStructure(data)
    };
  }

  analyzeTextData(data) {
    const { content } = data;
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      characterCount: content.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      topWords: this.getWordFrequency(words).slice(0, 10)
    };
  }

  inferDataType(values) {
    if (values.length === 0) return 'unknown';
    
    const sample = values.slice(0, 100);
    let numberCount = 0;
    let dateCount = 0;
    
    sample.forEach(value => {
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        numberCount++;
      }
      if (!isNaN(Date.parse(value))) {
        dateCount++;
      }
    });
    
    const numberRatio = numberCount / sample.length;
    const dateRatio = dateCount / sample.length;
    
    if (numberRatio > 0.8) return 'number';
    if (dateRatio > 0.8) return 'date';
    return 'string';
  }

  getJSONStructure(obj, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return '...';
    
    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        sample: obj.length > 0 ? this.getJSONStructure(obj[0], depth + 1, maxDepth) : null
      };
    }
    
    if (obj !== null && typeof obj === 'object') {
      const structure = {};
      Object.keys(obj).slice(0, 10).forEach(key => {
        structure[key] = this.getJSONStructure(obj[key], depth + 1, maxDepth);
      });
      return structure;
    }
    
    return typeof obj;
  }

  getWordFrequency(words) {
    const frequency = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) { // Changed from 2 to 3 to filter more short words
        frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([word, count]) => ({ word, count }));
  }

  async cleanData(data, options = {}) {
    // Implement data cleaning logic
    const cleaned = { ...data };
    
    if (options.removeNulls) {
      // Remove null/undefined values
    }
    
    if (options.removeDuplicates) {
      // Remove duplicate entries
    }
    
    if (options.normalizeText) {
      // Normalize text data
    }
    
    return cleaned;
  }

  async validateData(_data, _schema) {
    const errors = [];
    const warnings = [];
    
    // Implement data validation logic based on schema
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = new DataProcessor();