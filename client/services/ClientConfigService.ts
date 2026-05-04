import { JSONC } from 'bun';
import { ServicesHub } from '../../shared/ServicesHub';
import { try_ } from '../../shared/utils/try_';
import type { CLIService } from '../../shared/services/CLIService';

export class ClientConfigService extends ServicesHub.Service<'ClientConfig'> {
  private _config: ClientConfigService.Config.Root | null = null;

  constructor(private readonly _cli: CLIService) {
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
    const cmd_line_path = this._cli.args.get('-c') || this._cli.args.get('--config') || process.argv[2];

    if (!cmd_line_path || typeof cmd_line_path !== 'string') {
      throw Error('Path to config not provided or wrong format');
    }

    const config =
      await this._try_parse_config<typeof import('../../configs/client.gitignore.json')>(cmd_line_path);

    if (!config) {
      throw Error(`Can't read config file: "${cmd_line_path}"`);
    }

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
