import path from 'path';
import { mkdir, appendFile } from 'fs/promises';
import { inspect } from 'bun';
import { from_root } from '../../root';

type LogData = any[];

type LogConfig = {
  path: string;
};

const CONSOLE_ENABLED = !process.env.CONSOLE_DISABLED;

const INSPECT_OPTIONS_CONSOLE_LOG = { depth: Infinity, sorted: true, colors: true };
const INSPECT_OPTIONS_FILE = { depth: Infinity, compact: true, sorted: true };

const d = (datetime: Date | number) =>
  new Date(datetime).toLocaleDateString('ru', {
    hour12: false,

    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const dt = (datetime: Date | number) =>
  new Date(datetime).toLocaleString('ru', {
    hour12: false,

    year: 'numeric',
    month: '2-digit',
    day: '2-digit',

    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const log_to_file = (path: string, message: string) => appendFile(path, message).catch(() => {});

const filter_out_functions = (x: object) =>
  x !== null
    ? Array.isArray(x)
      ? x.filter(x => typeof x !== 'function')
      : x instanceof Error
        ? x
        : Object.fromEntries(Object.entries(x).filter(([_, value]) => typeof value !== 'function'))
    : x;

export const log = async (config: LogConfig, prefix: string, ...data: LogData) => {
  await mkdir(path.dirname(config.path), { recursive: true }).catch(() => {});

  const now = new Date();

  if (CONSOLE_ENABLED) {
    console.log(
      dt(now),
      prefix,
      ...data.map(x => (typeof x === 'object' ? inspect(filter_out_functions(x), INSPECT_OPTIONS_CONSOLE_LOG) : x))
    );
  }

  if (data.length) {
    const data_pretty = data
      .map(x => (typeof x === 'object' ? inspect(filter_out_functions(x), INSPECT_OPTIONS_FILE) : x))
      .join(' ');

    await log_to_file(config.path, `${dt(now)} ${prefix} ${data_pretty}\n`);
  } else {
    await log_to_file(config.path, `${dt(now)} ${prefix}\n`);
  }
};

log.default = (prefix: string, ...data: LogData) => log({ path: `./logs/${d(new Date())}.log` }, prefix, ...data);

log.server = (...data: LogData) => log({ path: `./logs/server_${d(new Date())}.log` }, '[SERVER]', ...data);

log.client = (...data: LogData) => log({ path: `./logs/client_${d(new Date())}.log` }, '[CLIENT]', ...data);
