import { useState, useEffect } from 'react';

export type OutputFormat = 'txt' | 'md' | 'yaml';

interface FormatConfig {
  label: string;
  extension: string;
  mimeType: string;
}

export const formatConfigs: Record<OutputFormat, FormatConfig> = {
  txt: {
    label: 'Text',
    extension: 'txt',
    mimeType: 'text/plain'
  },
  md: {
    label: 'Markdown',
    extension: 'md', 
    mimeType: 'text/markdown'
  },
  yaml: {
    label: 'YAML',
    extension: 'yaml',
    mimeType: 'text/yaml'
  }
};

export function useOutputFormat() {
  const [format, setFormat] = useState<OutputFormat>('txt');
  
  // Load format preference from localStorage
  useEffect(() => {
    try {
      const savedFormat = localStorage.getItem('rtctf-output-format') as OutputFormat;
      if (savedFormat && formatConfigs[savedFormat]) {
        setFormat(savedFormat);
      }
    } catch (error) {
      console.error('Error loading format preference:', error);
    }
  }, []);
  
  // Save format preference
  const changeFormat = (newFormat: OutputFormat) => {
    setFormat(newFormat);
    try {
      localStorage.setItem('rtctf-output-format', newFormat);
    } catch (error) {
      console.error('Error saving format preference:', error);
    }
  };
  
  // Format content based on selected format
  const formatContent = (content: string): string => {
    switch (format) {
      case 'md':
        return content; // Already in markdown format
        
      case 'yaml':
        return convertToYaml(content);
        
      case 'txt':
      default:
        return convertToText(content);
    }
  };
  
  return {
    format,
    changeFormat,
    formatContent,
    formatConfig: formatConfigs[format]
  };
}

function convertToText(content: string): string {
  // Remove markdown formatting for plain text
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/^#+\s/gm, '')          // Remove headers
    .replace(/^-\s/gm, '• ')         // Convert bullets
    .replace(/\n{3,}/g, '\n\n');     // Normalize line breaks
}

function convertToYaml(content: string): string {
  try {
    // Extract RTCTF components from markdown content
    const sections = {
      methodology: 'RTCTF',
      result: extractSection(content, 'R \\(Resultado Desejado\\):|Result Desired:'),
      task: extractSection(content, 'T \\(Tarefa Específica\\):|Task:'),
      context: extractSection(content, 'C \\(Contexto Relevante\\):|Context:'),
      criteria: extractSection(content, 'C \\(Critérios e Restrições\\):|Criteria:'),
      format: extractSection(content, 'F \\(Formato de Resposta\\):|Format:'),
      final_prompt: extractSection(content, 'PROMPT FINAL CONSOLIDADO:|FINAL CONSOLIDATED PROMPT:')
    };
    
    return `# RTCTF Prompt Structure
methodology: "${sections.methodology}"
components:
  result: |
    ${sections.result.replace(/\n/g, '\n    ')}
  task: |
    ${sections.task.replace(/\n/g, '\n    ')}
  context: |
    ${sections.context.replace(/\n/g, '\n    ')}
  criteria: |
    ${sections.criteria.replace(/\n/g, '\n    ')}
  format: |
    ${sections.format.replace(/\n/g, '\n    ')}

final_prompt: |
  ${sections.final_prompt.replace(/\n/g, '\n  ')}

metadata:
  generated_at: "${new Date().toISOString()}"
  version: "2.1"`;
  } catch (error) {
    console.error('Error converting to YAML:', error);
    return content;
  }
}

function extractSection(content: string, sectionPattern: string): string {
  const regex = new RegExp(`${sectionPattern}\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i');
  const match = content.match(regex);
  if (!match) return '';
  
  return match[1]
    .trim()
    .replace(/^\*\*.*?\*\*:?\s*/gm, '') // Remove section headers
    .replace(/^-\s/gm, '- ')            // Normalize bullets
    .trim();
}
