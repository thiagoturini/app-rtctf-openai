import { track } from '@vercel/analytics';

export interface AnalyticsEvent {
  // Eventos de transformação
  'prompt_generated': {
    source: 'AI' | 'Local' | 'AI Enhanced' | 'Local (AI unavailable)';
    input_length: number;
    output_length: number;
    output_format: 'txt' | 'md' | 'json';
    language: 'en' | 'pt';
  };
  
  // Eventos de interação
  'prompt_copied': {
    source: 'copy_button' | 'keyboard_shortcut';
    format: 'txt' | 'md' | 'json';
  };
  
  'prompt_downloaded': {
    format: 'txt' | 'md' | 'json';
  };
  
  'history_viewed': {
    items_count: number;
  };
  
  'history_item_reused': {
    age_minutes: number;
  };
  
  'example_used': {
    example_type: string;
    language: 'en' | 'pt';
  };
  
  // Novos eventos de customização
  'language_changed': {
    from: 'en' | 'pt';
    to: 'en' | 'pt';
  };
  
  'output_format_changed': {
    from: 'txt' | 'md' | 'json';
    to: 'txt' | 'md' | 'json';
  };
  
  'methodology_viewed': {
    language: 'en' | 'pt';
  };
  
  // Eventos de qualidade
  'ai_fallback_used': {
    reason: 'quota_exceeded' | 'api_error' | 'timeout';
  };
  
  'error_occurred': {
    error_type: 'api_error' | 'validation_error' | 'network_error';
    error_message?: string;
  };
}

export function useAnalytics() {
  const trackEvent = <T extends keyof AnalyticsEvent>(
    event: T,
    properties: AnalyticsEvent[T]
  ) => {
    try {
      track(event, properties);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  // Funções específicas para facilitar o uso
  const trackPromptGenerated = (
    source: AnalyticsEvent['prompt_generated']['source'],
    inputText: string,
    outputText: string,
    outputFormat: 'txt' | 'md' | 'json' = 'txt',
    language: 'en' | 'pt' = 'en'
  ) => {
    trackEvent('prompt_generated', {
      source,
      input_length: inputText.length,
      output_length: outputText.length,
      output_format: outputFormat,
      language,
    });
  };

  const trackPromptCopied = (
    source: 'copy_button' | 'keyboard_shortcut' = 'copy_button',
    format: 'txt' | 'md' | 'json' = 'txt'
  ) => {
    trackEvent('prompt_copied', { source, format });
  };

  const trackPromptDownloaded = (format: 'txt' | 'md' | 'json' = 'txt') => {
    trackEvent('prompt_downloaded', { format });
  };

  const trackHistoryViewed = (itemsCount: number) => {
    trackEvent('history_viewed', { items_count: itemsCount });
  };

  const trackHistoryItemReused = (timestamp: number) => {
    const ageMinutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    trackEvent('history_item_reused', { age_minutes: ageMinutes });
  };

  const trackExampleUsed = (exampleType: string, language: 'en' | 'pt' = 'en') => {
    trackEvent('example_used', { example_type: exampleType, language });
  };

  const trackLanguageChanged = (from: 'en' | 'pt', to: 'en' | 'pt') => {
    trackEvent('language_changed', { from, to });
  };

  const trackOutputFormatChanged = (
    from: 'txt' | 'md' | 'json',
    to: 'txt' | 'md' | 'json'
  ) => {
    trackEvent('output_format_changed', { from, to });
  };

  const trackMethodologyViewed = (language: 'en' | 'pt' = 'en') => {
    trackEvent('methodology_viewed', { language });
  };

  const trackAIFallback = (reason: AnalyticsEvent['ai_fallback_used']['reason']) => {
    trackEvent('ai_fallback_used', { reason });
  };

  const trackError = (
    errorType: AnalyticsEvent['error_occurred']['error_type'],
    errorMessage?: string
  ) => {
    trackEvent('error_occurred', { error_type: errorType, error_message: errorMessage });
  };

  return {
    trackEvent,
    trackPromptGenerated,
    trackPromptCopied,
    trackPromptDownloaded,
    trackHistoryViewed,
    trackHistoryItemReused,
    trackExampleUsed,
    trackLanguageChanged,
    trackOutputFormatChanged,
    trackMethodologyViewed,
    trackAIFallback,
    trackError,
  };
}
