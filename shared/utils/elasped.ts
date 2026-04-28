export const elapsed = (time: number) => Math.round(performance.now() - time);

export const elapsed_human = (time: number) => {
  const elapsed_ = elapsed(time);

  if (elapsed_ > 1000) {
    return [+(elapsed_ / 1000).toFixed(3), 's'];
  }

  return [elapsed_, 'ms'];
};
