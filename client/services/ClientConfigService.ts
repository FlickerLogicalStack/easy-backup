import { JSONC } from 'bun';
import { ServicesHub } from '../../shared/ServicesHub';
import { try_ } from '../../shared/utils/try_';

export class ClientConfigService extends ServicesHub.Service<'ClientConfig'> {
  private _config: ClientConfigService.Config.Root | null = null;

  constructor() {
    super('ClientConfig');
  }

  get config() {
    return this._config!;
  }

  private _try_parse_config = async <T extends ClientConfigService.Config.Root>(path: string) => {
    const config_file = Bun.file(path);

    const text = await config_file.text();

    return try_(() => JSONC.parse(text) as T);
  };

  override start = async () => {
    const cmd_line_path = process.argv[2];

    if (!cmd_line_path) {
      this.__log('No config path in cli');
      return;
    }

    const config =
      await this._try_parse_config<typeof import('../../configs/client.gitignore.json')>(cmd_line_path);

    this._config = config;

    this.__log('Started with config', this._config);
  };
}

export namespace ClientConfigService {
  export namespace Config {
    export type ServerConfig = {
      ip: string;
      port: number;
      key: string;
    };

    export type BackupConfig = {
      directory: string;
      cron: string;
      servers: (keyof Root['servers'])[];

      password?: string;
      include?: string[];
      exclude?: string[];
      on_start?: boolean;
    };

    export type Root = {
      name: string;
      servers: Record<string, ServerConfig>;
      backups: Record<string, BackupConfig>;
    };
  }
}
