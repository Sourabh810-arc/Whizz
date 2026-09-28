import { useEffect, useRef } from 'react';

/**
 * Runs local browser speech recognition on the user's own mic and streams
 * recognized lines to the room via the "caption-line" socket event, which the
 * server also persists to the meeting transcript (used later for AI summaries).
 */
export const useLiveCaptions = ({ socket, meetingId, userName, language, enabled }) => {
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!enabled || !socket || !meetingId) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser (try Chrome/Edge).');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language || 'en-US';

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (!text) return;
        socket.emit('caption-line', { meetingId, speaker: userName, text });
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.warn('SpeechRecognition error:', e.error);
    };

    recognition.onend = () => {
      if (enabled) {
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Could not start recognition', e);
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [enabled, socket, meetingId, language, userName]);
};
