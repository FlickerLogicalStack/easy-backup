import path from 'path';

export const from_root = (...p: string[]) => path.join(import.meta.dir, ...p);
