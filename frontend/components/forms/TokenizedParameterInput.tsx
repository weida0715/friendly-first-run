"use client";

import { useState, type KeyboardEvent } from 'react';

import { FormErrorText } from './FormErrorText';

export type ParameterConstraint = {
  default?: unknown;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  allowed_values?: unknown[];
  allowedValues?: unknown[];
};

export type TokenizedParamType = 'number-list' | 'integer-list' | 'number' | 'integer' | 'string' | 'boolean';

export interface TokenizedParamDefinition {
  name: string;
  default: string;
  type?: TokenizedParamType;
  description?: string;
  constraint?: ParameterConstraint;
}

export const tokensFromValue = (value: string) => (value || '').split(',').map((entry) => entry.trim()).filter(Boolean);
export const valueFromTokens = (tokens: string[]) => tokens.join(',');
export const allowedValuesFor = (param: TokenizedParamDefinition) => (param.constraint?.allowedValues ?? param.constraint?.allowed_values ?? []).map((value) => value === null ? 'null' : String(value));

export const describeConstraint = (param: TokenizedParamDefinition) => {
  const rule = param.constraint ?? {};
  const parts = [param.description].filter(Boolean) as string[];
  if (rule.required) parts.push('required');
  if (rule.min !== undefined) parts.push(`min ${rule.min}`);
  if (rule.max !== undefined) parts.push(`max ${rule.max}`);
  const allowed = allowedValuesFor(param);
  if (allowed.length) parts.push(`options: ${allowed.join(' · ')}`);
  if (!parts.length && param.type) parts.push(param.type.replace('-list', ' list'));
  return parts.join(' · ');
};

export const validateParamToken = (token: string, param: TokenizedParamDefinition) => {
  const type = param.type ?? 'number-list';
  const rule = param.constraint ?? {};
  const allowed = allowedValuesFor(param);
  if (!token.trim()) return 'Value is required.';
  if (allowed.length && !allowed.includes(token)) return `Choose one of: ${allowed.join(', ')}.`;
  const numeric = Number(token);
  if ((type === 'number-list' || type === 'number' || type === 'integer-list' || type === 'integer') && Number.isNaN(numeric)) return 'Value must be numeric.';
  if ((type === 'integer-list' || type === 'integer') && !Number.isInteger(numeric)) return 'Value must be a whole number.';
  if (!Number.isNaN(numeric) && rule.min !== undefined && numeric < Number(rule.min)) return `Value must be >= ${rule.min}.`;
  if (!Number.isNaN(numeric) && rule.max !== undefined && numeric > Number(rule.max)) return `Value must be <= ${rule.max}.`;
  return '';
};

export function TokenizedParameterInput({ value, param, error, onChange }: { value: string; param: TokenizedParamDefinition; error?: string; onChange: (value: string) => void }) {
  const tokens = tokensFromValue(value);
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState('');
  const allowed = allowedValuesFor(param);

  const commitToken = (raw: string) => {
    const token = raw.trim();
    const message = validateParamToken(token, param);
    if (message) {
      setLocalError(message);
      return false;
    }
    if (!tokens.includes(token)) onChange(valueFromTokens([...tokens, token]));
    setDraft('');
    setLocalError('');
    return true;
  };

  const removeToken = (index: number) => onChange(valueFromTokens(tokens.filter((_, itemIndex) => itemIndex !== index)));

  if (allowed.length > 0) {
    return (
      <div className="space-y-2">
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" aria-label={`${param.name} options`} value="" onChange={(event) => event.target.value && commitToken(event.target.value)}>
          <option value="">Select option…</option>
          {allowed.map((option) => <option key={option} value={option} disabled={tokens.includes(option)}>{option}</option>)}
        </select>
        <div className="flex min-h-9 flex-wrap gap-2 rounded-md border border-input bg-background p-2">
          {tokens.map((token, index) => <button type="button" key={`${token}-${index}`} className="group rounded border bg-muted px-2 py-1 text-xs" onClick={() => removeToken(index)} aria-label={`Remove ${token}`}>{token}<span className="ml-1 opacity-0 group-hover:opacity-100">×</span></button>)}
          {tokens.length === 0 ? <span className="text-xs text-muted-foreground">No options selected.</span> : null}
        </div>
        <FormErrorText message={error || localError} />
      </div>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === ' ') {
      event.preventDefault();
      commitToken(draft);
    } else if (event.key === 'Backspace' && !draft && tokens.length > 0) {
      const nextTokens = tokens.slice(0, -1);
      setDraft(tokens[tokens.length - 1]);
      onChange(valueFromTokens(nextTokens));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2">
        {tokens.map((token, index) => <button type="button" key={`${token}-${index}`} className="group rounded border bg-muted px-2 py-1 text-xs" onClick={() => removeToken(index)} aria-label={`Remove ${token}`}>{token}<span className="ml-1 opacity-0 group-hover:opacity-100">×</span></button>)}
        <input className="min-w-20 flex-1 bg-transparent text-sm outline-none" aria-label={`${param.name} value`} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder={tokens.length ? 'type + space' : param.default} />
      </div>
      {(localError || error) ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">{localError || error}</div> : null}
    </div>
  );
}