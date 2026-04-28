export const try_ = <TResult, TDefault = TResult | null>(
  fn: () => TResult,
  fallback: () => TDefault = () => null as TDefault
): TResult | TDefault => {
  try {
    return fn();
  } catch {
    return fallback();
  }
};
