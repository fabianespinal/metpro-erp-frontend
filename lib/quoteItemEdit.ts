/**
 * Item edit helper for the quote form. QuoteItemRow calls
 * onChange(index, "field", value); other callers pass a patch object.
 * Both forms are accepted, so local state is always updated and the totals
 * (derived from local items) change immediately, saved or not.
 */
export function applyItemChange<T extends object>(
  item: T,
  fieldOrPatch: string | Partial<T>,
  value?: unknown
): T {
  if (typeof fieldOrPatch === "string") {
    return { ...item, [fieldOrPatch]: value } as T;
  }
  return { ...item, ...fieldOrPatch };
}
