/// <reference types="vite/client" />
/// <reference types="@types/openfin" />

declare global {
  interface Window {
    fin?: typeof fin;
  }
}
