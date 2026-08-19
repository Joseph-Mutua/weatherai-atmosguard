import { Ajv, type AnySchema, type ErrorObject, type ValidateFunction } from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: true });
const validators = new Map<string, ValidateFunction>();

export class ContractValidationError extends Error {
  readonly violations: readonly ErrorObject[];

  constructor(schemaId: string, violations: readonly ErrorObject[]) {
    const details = violations
      .map(({ instancePath, message }) => `${instancePath || '/'} ${message ?? 'is invalid'}`)
      .join('; ');
    super(`Contract validation failed for ${schemaId}: ${details}`);
    this.name = 'ContractValidationError';
    this.violations = violations;
  }
}

function schemaIdentifier(schema: AnySchema): string {
  if (typeof schema === 'boolean') return String(schema);
  return typeof schema.$id === 'string' ? schema.$id : JSON.stringify(schema);
}

export function validateContract<T>(schema: AnySchema, data: unknown): asserts data is T {
  const identifier = schemaIdentifier(schema);
  const cached = validators.get(identifier);
  const validator = cached ?? ajv.compile<T>(schema);
  if (!cached) {
    validators.set(identifier, validator);
  }

  if (!validator(data)) {
    throw new ContractValidationError(identifier, validator.errors ?? []);
  }
}
