import { useState, useEffect } from 'react';
import { useTranslations } from './useTranslations';

export function useDynamicPlaceholder() {
  const { t } = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    const examples = t.placeholderExamples;
    if (examples && examples.length > 0) {
      setPlaceholder(examples[currentIndex]);
      
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % examples.length);
      }, 3000); // Change every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [t.placeholderExamples, currentIndex]);

  return placeholder;
}
