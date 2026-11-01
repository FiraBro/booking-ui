import { isRecord } from "@/lib/utils";

/** Reads an id from `{ id }` or from `{ [wrapperKey]: { id } }`. Used when a create/update response is minimal. */
export function extractId(raw: unknown, wrapperKey?: string): string | null {
  if (!isRecord(raw)) return null;
  const direct = raw.id;
  if (typeof direct === "string" || typeof direct === "number")
    return String(direct);
  const wrapped = wrapperKey ? raw[wrapperKey] : undefined;
  return isRecord(wrapped) ? extractId(wrapped) : null;
}

/** Zod preprocess helper that unwraps `{ [key]: entity }` responses and leaves everything else untouched. */
export function unwrapKey(key: string): (value: unknown) => unknown {
  return (value) => {
    if (isRecord(value)) {
      const inner = value[key];
      if (isRecord(inner)) return inner;
    }
    return value;
  };
}
