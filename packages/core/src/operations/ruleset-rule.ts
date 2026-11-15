/** A rule as a ruleset detail returns it. */
export type RulesetRule = {
  action: string;
  action_parameters?: { uri?: { path?: { expression?: string } } };
  description: string;
  enabled: boolean;
  expression?: string;
  id?: string;
};
