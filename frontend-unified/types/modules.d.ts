/* eslint-disable @typescript-eslint/no-explicit-any */
// Type declarations for Vue remote modules
// We use 'any' here because we don't have type definitions for the external Vue module

declare module '/vue-remote/assets/remoteEntry.js' {
  export function get(module: string): Promise<any>
  export function init(shared: any): Promise<void>
  export const dynamicLoadingCss: any
}

declare module '/vue-remote/dist/assets/remoteEntry.js' {
  export function get(module: string): Promise<any>
  export function init(shared: any): Promise<void>
  export const dynamicLoadingCss: any
}
