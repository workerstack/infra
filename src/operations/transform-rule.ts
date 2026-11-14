/** Mirrors the transform rule schema's output so drift diffs compare like with like. */
export type TransformRule = {
  description: string;
  enabled: boolean;
  expression: string;
  pathExpression: string;
};
