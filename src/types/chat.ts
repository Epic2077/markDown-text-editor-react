export type CodeExecutionResult = {
  code: string;
  language: string;
  output: string;
  error?: string;
  executionTime: number;
};
