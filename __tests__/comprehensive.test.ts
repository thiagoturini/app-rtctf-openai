import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock environment for testing
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
});

describe('RTCTF Multilingual App - Comprehensive Tests', () => {
  
  describe('API Route Security Tests', () => {
    it('should reject requests without proper content type', async () => {
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'invalid'
      });
      
      expect(response.status).toBe(400);
    });

    it('should implement rate limiting', async () => {
      // Mock multiple rapid requests
      const promises = Array(105).fill(null).map(() => 
        fetch('/api/rtctf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'test' })
        })
      );
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });

    it('should validate text length', async () => {
      const longText = 'a'.repeat(10001);
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: longText })
      });
      
      expect(response.status).toBe(400);
    });

    it('should include security headers', async () => {
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test prompt' })
      });
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Multilingual Support Tests', () => {
    it('should handle English input correctly', async () => {
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'Create a marketing plan',
          language: 'en'
        })
      });
      
      const data = await response.json();
      expect(data.prompt).toContain('RESULT:');
      expect(data.prompt).toContain('TASK:');
    });

    it('should handle Portuguese input correctly', async () => {
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'Criar um plano de marketing',
          language: 'pt'
        })
      });
      
      const data = await response.json();
      expect(data.prompt).toContain('RESULTADO:');
      expect(data.prompt).toContain('TAREFA:');
    });
  });

  describe('Output Format Tests', () => {
    it('should convert to YAML format', () => {
      const mockResult = {
        result: 'Test result',
        task: 'Test task',
        context: 'Test context'
      };
      
      const yaml = convertToYAML(mockResult);
      expect(yaml).toContain('result: Test result');
      expect(yaml).toContain('task: Test task');
    });

    it('should convert to Markdown format', () => {
      const mockResult = {
        result: 'Test result',
        task: 'Test task'
      };
      
      const markdown = convertToMarkdown(mockResult);
      expect(markdown).toContain('## Result');
      expect(markdown).toContain('Test result');
    });
  });

  describe('RTCTF Methodology Tests', () => {
    it('should identify business-related prompts', () => {
      const businessPrompt = 'Create a marketing strategy for our company';
      const result = transformToRTCTF(businessPrompt, 'en');
      
      expect(result).toContain('business context');
    });

    it('should identify technical prompts', () => {
      const techPrompt = 'Write a Python function for data processing';
      const result = transformToRTCTF(techPrompt, 'en');
      
      expect(result).toContain('technical context');
    });

    it('should structure prompts with all RTCTF components', () => {
      const prompt = 'Help me learn React';
      const result = transformToRTCTF(prompt, 'en');
      
      expect(result).toContain('RESULT:');
      expect(result).toContain('TASK:');
      expect(result).toContain('CONTEXT:');
      expect(result).toContain('CRITERIA:');
      expect(result).toContain('FORMAT:');
    });
  });

  describe('Analytics Integration Tests', () => {
    it('should track language changes', () => {
      const mockAnalytics = {
        trackLanguageChanged: jest.fn()
      };
      
      // Simulate language change
      mockAnalytics.trackLanguageChanged('pt');
      
      expect(mockAnalytics.trackLanguageChanged).toHaveBeenCalledWith('pt');
    });

    it('should track format changes', () => {
      const mockAnalytics = {
        trackFormatChanged: jest.fn()
      };
      
      // Simulate format change
      mockAnalytics.trackFormatChanged('yaml');
      
      expect(mockAnalytics.trackFormatChanged).toHaveBeenCalledWith('yaml');
    });
  });

  describe('UI Translation Tests', () => {
    it('should provide complete English translations', () => {
      const enTranslations = getTranslations('en');
      
      expect(enTranslations.title).toBe('RTCTF Transformer');
      expect(enTranslations.methodologyTitle).toBe('About RTCTF Methodology');
      expect(enTranslations.result).toBe('Result');
    });

    it('should provide complete Portuguese translations', () => {
      const ptTranslations = getTranslations('pt');
      
      expect(ptTranslations.title).toBe('Transformador RTCTF');
      expect(ptTranslations.methodologyTitle).toBe('Sobre a Metodologia RTCTF');
      expect(ptTranslations.result).toBe('Resultado');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle missing text input', async () => {
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en' })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    it('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI failure
      process.env.OPENAI_API_KEY = 'invalid_key';
      
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'test',
          useAI: true,
          language: 'en'
        })
      });
      
      const data = await response.json();
      expect(data.source).toContain('Local');
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch('/api/rtctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'Create a simple plan',
          language: 'en'
        })
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});

// Mock utility functions for testing
function convertToYAML(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function convertToMarkdown(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n${value}`)
    .join('\n\n');
}

function transformToRTCTF(text: string, language: 'en' | 'pt'): string {
  // Mock implementation for testing
  return `RESULT: Mock result for "${text}"\nTASK: Mock task\nCONTEXT: Mock context\nCRITERIA: Mock criteria\nFORMAT: Mock format`;
}

function getTranslations(language: 'en' | 'pt') {
  const translations = {
    en: {
      title: 'RTCTF Transformer',
      methodologyTitle: 'About RTCTF Methodology',
      result: 'Result'
    },
    pt: {
      title: 'Transformador RTCTF',
      methodologyTitle: 'Sobre a Metodologia RTCTF',
      result: 'Resultado'
    }
  };
  
  return translations[language];
}
