import { environment } from '../../../environments/environment';

export function debugLog(...args: any[]): void {
  if (!environment.production) {
    console.log(...args);
  }
}

export function debugError(...args: any[]): void {
  if (!environment.production) {
    console.error(...args);
  }
}