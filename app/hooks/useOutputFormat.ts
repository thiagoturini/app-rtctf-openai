import { useState, useEffect } from 'react';

export type OutputFormat = 'txt' | 'md' | 'json';

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
  json: {
    label: 'JSON',
    extension: 'json',
    mimeType: 'application/json'
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
        return formatToMarkdown(content);
        
      case 'json':
        return convertToJSON(content);
        
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

function formatToMarkdown(content: string): string {
  // Convert plain text to proper markdown with consistent formatting
  let result = content;
  
  // First, ensure we have clean text (remove any existing markdown)
  result = convertToText(result);
  
  // Now apply markdown formatting
  result = result
    // Convert main titles (standalone lines that look like titles)
    .replace(/^([A-Z][^:\n]*[^:\n])$/gm, '# $1')
    
    // Convert labels followed by colon to bold (like "Autor:", "Data:")
    .replace(/^([A-Za-z\s]+):\s*(.+)$/gm, '**$1:** $2')
    
    // Convert section headers that end with colon only (like "Tarefas concluídas:")
    .replace(/^([A-Za-z\s]+):$/gm, '## $1')
    
    // Convert bullet points to proper markdown bullets
    .replace(/^•\s+/gm, '- ')
    
    // Add proper line breaks after headings and before lists
    .replace(/^(#+ .+)$/gm, '$1\n')
    .replace(/^(\*\*[^:]+:\*\* .+)$/gm, '$1  ')
    
    // Clean up excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  return result;
}

function convertToText(content: string): string {
  // Convert to clean plain text - remove ALL markdown formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1')           // Remove bold **text**
    .replace(/\*(.*?)\*/g, '$1')               // Remove italic *text*
    .replace(/^#+\s+/gm, '')                   // Remove headers (# ## ### etc)
    .replace(/^-\s+/gm, '• ')                  // Convert bullets
    .replace(/`([^`]+)`/g, '$1')               // Remove inline code `code`
    .replace(/```[\s\S]*?```/g, '')            // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // Remove links [text](url), keep text
    .replace(/^\s*>\s*/gm, '')                 // Remove blockquotes
    .replace(/^\s*\|\s*.*\s*\|.*$/gm, '')      // Remove tables
    .replace(/---+/g, '')                      // Remove horizontal rules
    .replace(/\n{3,}/g, '\n\n')                // Normalize multiple line breaks
    .replace(/^\s+/gm, '')                     // Remove leading whitespace
    .replace(/\s+$/gm, '')                     // Remove trailing whitespace
    .trim();
}

function convertToJSON(content: string): string {
  try {
    // Start with clean text
    const cleanContent = convertToText(content);
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
    const jsonObject: Record<string, unknown> = {};
    const paragraphs: string[] = [];
    let currentListKey = '';
    let currentList: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) continue;
      
      // Check for key-value pairs (like "Autor: Thiago Pinto")
      if (trimmed.includes(':') && !trimmed.startsWith('•') && !trimmed.endsWith(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
        const value = trimmed.substring(colonIndex + 1).trim();
        if (key && value) {
          jsonObject[key] = value;
        }
      }
      // Check for section headers (ending with :)
      else if (trimmed.endsWith(':')) {
        // Save previous list if exists
        if (currentListKey && currentList.length > 0) {
          jsonObject[currentListKey] = currentList;
        }
        // Start new list
        currentListKey = trimmed.slice(0, -1).toLowerCase().replace(/\s+/g, '_');
        currentList = [];
      }
      // Check for list items
      else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const item = trimmed.substring(1).trim();
        if (currentListKey) {
          currentList.push(item);
        }
      }
      // Check if it looks like a title (no colons, standalone)
      else if (!trimmed.includes(':') && lines.indexOf(line) < 3) {
        if (!jsonObject.titulo) {
          jsonObject.titulo = trimmed;
        }
      }
      // Regular paragraph
      else {
        paragraphs.push(trimmed);
      }
    }
    
    // Save final list if exists
    if (currentListKey && currentList.length > 0) {
      jsonObject[currentListKey] = currentList;
    }
    
    // Add paragraphs if any
    if (paragraphs.length > 0) {
      jsonObject.paragrafos = paragraphs;
    }
    
    return JSON.stringify(jsonObject, null, 2);
    
  } catch (error) {
    console.error('Error converting to JSON:', error);
    return JSON.stringify({
      error: "Conversion failed",
      original_content: content,
      generated_at: new Date().toISOString()
    }, null, 2);
  }
}
