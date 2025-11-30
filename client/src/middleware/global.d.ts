export {};

declare global {
  interface Window {
    mySocket: any; // or WebSocket if you're using native WS
  }
}