/** JSON-safe values. Constructors validate representations, not source authenticity. */
declare const brand: unique symbol;
export type UInt = string & { readonly [brand]: 'uint-decimal' };
export type Int = string & { readonly [brand]: 'int-decimal' };
export type Address = string & { readonly [brand]: 'evm-address' };
export type Bytes32 = string & { readonly [brand]: 'bytes32' };
export type UnitInterval = number & { readonly [brand]: 'unit-interval' };
export type InputLevel = number & { readonly [brand]: 'input-0-10000' };
export type Milliseconds = number & { readonly [brand]: 'milliseconds' };
export function uint(value: string): UInt {
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new Error('Canonical unsigned decimal required');
  return value as UInt;
}
export function int(value: string): Int {
  if (!/^(0|-?[1-9]\d*)$/.test(value)) throw new Error('Canonical signed decimal required');
  return value as Int;
}
export function address(value: string): Address {
  if (!/^0x[0-9a-f]{40}$/i.test(value)) throw new Error('EVM address required');
  return value.toLowerCase() as Address;
}
export function bytes32(value: string): Bytes32 {
  if (!/^0x[0-9a-f]{64}$/i.test(value)) throw new Error('32-byte hex required');
  return value.toLowerCase() as Bytes32;
}
export function unit(value: number): UnitInterval {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Value outside [0,1]');
  return value as UnitInterval;
}
export function inputLevel(value: number): InputLevel {
  if (!Number.isInteger(value) || value < 0 || value > 10000) throw new Error('Integer outside [0,10000]');
  return value as InputLevel;
}
export function milliseconds(value: number): Milliseconds {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Nonnegative safe integer milliseconds required');
  return value as Milliseconds;
}
