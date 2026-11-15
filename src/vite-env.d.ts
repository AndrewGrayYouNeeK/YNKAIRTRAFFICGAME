/// <reference types="vite/client" />

interface Window {
  __atcPreview?: {
    setScene: (scene?: any) => void;
  };
  webkitAudioContext?: typeof AudioContext;
}
