'use client';

import { useState, useEffect, useRef } from 'react';

interface UseTypingAnimationProps {
  texts: string[];
  speed?: number;
  pause?: number;
  startDelay?: number;
}

export function useTypingAnimation({ 
  texts, 
  speed = 50, 
  pause = 2000,
  startDelay = 1000 
}: UseTypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (texts.length === 0) return;

    const typeText = async () => {
      const currentText = texts[currentIndex];
      
      if (isTyping) {
        // Typing phase
        for (let i = 0; i <= currentText.length; i++) {
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(() => {
              setDisplayText(currentText.slice(0, i));
              resolve(void 0);
            }, speed);
          });
        }
        
        // Pause at end of text
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            resolve(void 0);
          }, pause);
        });
        
        // Erasing phase
        for (let i = currentText.length; i >= 0; i--) {
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(() => {
              setDisplayText(currentText.slice(0, i));
              resolve(void 0);
            }, speed / 2); // Erase faster than typing
          });
        }
        
        // Move to next text
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % texts.length);
            setIsTyping(true);
            resolve(void 0);
          }, 200);
        });
      }
    };

    // Start after initial delay
    const startTimeout = setTimeout(() => {
      typeText();
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isTyping, texts, speed, pause, startDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    displayText,
    isTyping,
    currentIndex
  };
}
