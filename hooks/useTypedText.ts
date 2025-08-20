
import { useState, useEffect } from 'react';

/**
 * A custom hook that simulates a typing effect for an array of strings.
 *
 * @param texts - An array of strings to be typed out.
 * @param typingSpeed - Speed of typing in milliseconds.
 * @param deletingSpeed - Speed of deleting in milliseconds.
 * @param delay - Delay in milliseconds before starting to delete a completed text.
 * @returns The currently displayed text string with the typing effect.
 */
export const useTypedText = (texts: string[], typingSpeed = 100, deletingSpeed = 50, delay = 2000): string => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleTyping = () => {
      const currentText = texts[index];
      if (isDeleting) {
        setText(currentText.substring(0, text.length - 1));
      } else {
        setText(currentText.substring(0, text.length + 1));
      }

      if (!isDeleting && text === currentText) {
        setTimeout(() => setIsDeleting(true), delay);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setIndex((prevIndex) => (prevIndex + 1) % texts.length);
      }
    };

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const typingTimeout = setTimeout(handleTyping, speed);

    return () => clearTimeout(typingTimeout);
  }, [text, isDeleting, index, texts, typingSpeed, deletingSpeed, delay]);

  return text;
};
