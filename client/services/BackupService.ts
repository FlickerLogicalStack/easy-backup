import { tmpdir } from 'os';
import path from 'path';
import { rm } from 'fs/promises';
import { Glob } from 'bun';

import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';

import { elapsed_human } from '../../shared/utils/elasped';
import { ServicesHub } from '../../shared/ServicesHub';
import type { APIService } from './APIService';
import type { ClientConfigService } from './ClientConfigService';

const scan_files = (dir: string, include: string[] = [], exclude: string[] = []) => {
  const result = new Set<string>();

  const include_globs = include.length > 0 ? include.map(pattern => new Glob(pattern)) : [scan_files.WILDCARD_GLOB];
  const exclude_globs = exclude.map(pattern => new Glob(pattern));

  for (const include_glob of include_globs) {
    for (const path_ of include_glob.scanSync(dir)) {
      if (exclude_globs.some(exclude_glob => exclude_glob.match(path_))) {
        continue;
      }

      result.add(path.join(dir, path_));
    }
  }

  return result;
};

scan_files.WILDCARD_GLOB = new Glob('**/*');

const using_dir_zip = async (config: { base: string; files_list: string[]; password?: string }) => {
  const base = config.base;
  const files_list = config.files_list;
  const password = config.password;

  const tmp_path = `${tmpdir()}/${crypto.randomUUID()}.zip`;

  const blob_writer = new BlobWriter('application/zip');
  const zip_writer = new ZipWriter(blob_writer, { password });

  await Promise.all(
    files_list.map(file_path =>
      Bun.file(file_path)
        .arrayBuffer()
        .then(array_buffer =>
          zip_writer.add(path.relative(base, file_path).replace(/\\/g, '/'), new BlobReader(new Blob([array_buffer])))
        )
    )
  );

  await zip_writer.close();

  const file = Bun.file(tmp_path);

  await file.write(await (await blob_writer.getData()).bytes());

  return {
    zip: file,
    cleanup: () => rm(tmp_path, { recursive: true }),
  };
};

export class BackupService extends ServicesHub.Service<'Backup'> {
  private _config!: ClientConfigService.Config.Root;

  private readonly _crons: Bun.CronJob[] = [];

  private readonly _executing_cros = new Set<string>();

  constructor(
    private readonly _client_config: ClientConfigService,
    private readonly _api: APIService
  ) {
    super('Backup');
  }

  override start = async () => {
    this._config = this._client_config.config;

    Object.entries(this._config.backups).forEach(([name, backup_config]) => {
      this.init_backup(name, backup_config);
    });
  };

  private server = (name: string) => Object.entries(this._config.servers).find(([_name]) => name === _name)?.[1]!;

  override shutdown = async () => {
    this._crons.forEach(x => x.stop());
  };

  private get_alive_servers = (servers_names: string[]) =>
    Promise.all(servers_names.map(name => this._api.ping(name).then(is_alive => ({ name, is_alive })))).then(
      pings_results => pings_results.filter(({ is_alive }) => is_alive).map(({ name }) => name)
    );

  private init_backup = (backup_name: string, backup_config: ClientConfigService.Config.BackupConfig) => {
    this.__log(`Init Backup "${backup_name}"`, {
      cron: backup_config.cron,
      directory: backup_config.directory,
      servers: backup_config.servers,
    });

    const on_backup = async () => {
      if (this._executing_cros.has(backup_name)) {
        this.__log(`Skipping backup "${backup_name}": Already Executing`);

        return;
      }

      this._executing_cros.add(backup_name);

      await this._on_backup(backup_name, backup_config);

      this._executing_cros.delete(backup_name);
    };

    this._crons.push(Bun.cron(backup_config.cron, on_backup));

    if (backup_config.on_start) {
      on_backup();
    }
  };

  private _on_backup = async (backup_name: string, backup_config: ClientConfigService.Config.BackupConfig) => {
    const cron_id = crypto.randomUUID().split('-')[0];

    await this.__log(`(${cron_id}) Backup Triggered "${backup_name}"`);

    const alive_servers = await this.get_alive_servers(backup_config.servers);

    if (!alive_servers.length) {
      await this.__log(`(${cron_id}) No Alive Servers, Backup Skipped`);

      return;
    }

    const glob_start = performance.now();
    const files_list = Array.from(scan_files(backup_config.directory, backup_config.include, backup_config.exclude));
    await this.__log(`(${cron_id}) Globing`, ...elapsed_human(glob_start));

    const compression_start = performance.now();
    const { zip, cleanup } = await using_dir_zip({
      files_list,
      base: backup_config.directory,
      password: backup_config.password,
    });
    await this.__log(`(${cron_id}) Compression`, ...elapsed_human(compression_start));

    await Promise.all(
      alive_servers.map(async server_name => {
        const send_start = performance.now();

        const result = await this._api.send_zip(this._config.name, backup_name, this.server(server_name), zip);

        await this.__log(`(${cron_id}) Sended to "${server_name}"`, result, ...elapsed_human(send_start));

        return result;
      })
    );

    await cleanup();
  };
}
