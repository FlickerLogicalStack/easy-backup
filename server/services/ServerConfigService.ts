import { JSONC } from 'bun';
import { ServicesHub } from '../../shared/ServicesHub';
import { try_ } from '../../shared/utils/try_';

export class ServerConfigService extends ServicesHub.Service<'ServerConfig'> {
  private _config: ServerConfigService.Config.Root | null = null;

  constructor() {
    super('ServerConfig');
  }

  get config() {
    return this._config!;
  }

  private _try_parse_config = async <T extends ServerConfigService.Config.Root>(path: string) => {
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
      await this._try_parse_config<typeof import('../../configs/server.gitignore.json')>(cmd_line_path);

    this._config = config;

    this.__log('Started with config', this._config);
  };
}

export namespace ServerConfigService {
  export namespace Config {
    export type ServerConfig = {
      port: number;
      key: string;
      root_folder: string;
    };

    export type Root = {
      name: string;
      server: ServerConfig;
    };
  }
}
