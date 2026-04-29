import { JSONC } from 'bun';
import { ServicesHub } from '../../shared/ServicesHub';
import type { CLIService } from '../../shared/services/CLIService';

export class ServerConfigService extends ServicesHub.Service<'ServerConfig'> {
  private _config: ServerConfigService.Config.Root | null = null;

  constructor(private readonly _cli: CLIService) {
    super('ServerConfig');
  }

  get config() {
    return this._config!;
  }

  private _try_parse_config = async <T extends ServerConfigService.Config.Root>(path: string) => {
    const config_file = Bun.file(path);

    try {
      const text = await config_file.text();

      return JSONC.parse(text) as T;
    } catch (e) {
      return null;
    }
  };

  override start = async () => {
    const cmd_line_path = this._cli.args.get('-c') || this._cli.args.get('--config');

    if (!cmd_line_path || typeof cmd_line_path !== 'string') {
      throw Error('Path to config nor provided or wrong format');
    }

    const config = await this._try_parse_config<typeof import('../../configs/server.gitignore.json')>(cmd_line_path);

    if (!config) {
      throw Error(`Can\'t read config file: "${cmd_line_path}"`);
    }

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
