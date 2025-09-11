// Type declaration for amplify_outputs.json
// This file allows TypeScript to compile even when amplify_outputs.json is missing (CI/CD)
declare module '../../amplify_outputs.json' {
  const config: Record<string, unknown>;
  export default config;
}
