import { track } from '@vercel/analytics';

export interface AnalyticsEvent {
  // Eventos de transformação
  'prompt_generated': {
    source: 'AI' | 'Local' | 'AI Enhanced' | 'Local (AI unavailable)';
    input_length: number;
    output_length: number;
  };
  
  // Eventos de interação
  'prompt_copied': {
    source: 'copy_button' | 'keyboard_shortcut';
  };
  
  'prompt_downloaded': {
    format: 'txt';
  };
  
  'history_viewed': {
    items_count: number;
  };
  
  'history_item_reused': {
    age_minutes: number;
  };
  
  'example_used': {
    example_type: string;
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
    outputText: string
  ) => {
    trackEvent('prompt_generated', {
      source,
      input_length: inputText.length,
      output_length: outputText.length,
    });
  };

  const trackPromptCopied = (source: 'copy_button' | 'keyboard_shortcut' = 'copy_button') => {
    trackEvent('prompt_copied', { source });
  };

  const trackPromptDownloaded = () => {
    trackEvent('prompt_downloaded', { format: 'txt' });
  };

  const trackHistoryViewed = (itemsCount: number) => {
    trackEvent('history_viewed', { items_count: itemsCount });
  };

  const trackHistoryItemReused = (timestamp: number) => {
    const ageMinutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    trackEvent('history_item_reused', { age_minutes: ageMinutes });
  };

  const trackExampleUsed = (exampleType: string) => {
    trackEvent('example_used', { example_type: exampleType });
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
    trackAIFallback,
    trackError,
  };
}
