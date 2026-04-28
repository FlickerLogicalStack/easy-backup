import { ServicesHub } from '../../shared/ServicesHub';
import { size_human } from '../../shared/utils/size_human';
import type { ClientConfigService } from './ClientConfigService';

export class APIService extends ServicesHub.Service<'API'> {
  private _config!: ClientConfigService.Config.Root;

  private _is_alive_cache = new Set<string>();
  private _is_alive_timeouts = new Map<string, NodeJS.Timeout>();

  constructor(private readonly _client_config: ClientConfigService) {
    super('API');
  }

  override start = async () => {
    this._config = this._client_config.config;
  };

  private server = (name: string) => Object.entries(this._config.servers).find(([_name]) => name === _name)?.[1]!;

  ping = async (server_name: string) => {
    if (this._is_alive_cache.has(server_name)) {
      return Promise.resolve(true);
    }

    const config = this.server(server_name);

    await this.__log(`/ping/ "${server_name}"`);

    return fetch(`http://${config.ip}:${config.port}/ping/`)
      .catch(() => null)
      .then(response => {
        const is_alive = response?.status === 204;

        if (is_alive) {
          this._is_alive_cache.add(server_name);

          clearTimeout(this._is_alive_timeouts.get(server_name));
          this._is_alive_timeouts.set(
            server_name,
            setTimeout(() => this._is_alive_cache.delete(server_name), 5000)
          );
        }

        return is_alive;
      });
  };

  send_zip = (
    client_name: string,
    backup_name: string,
    server_config: ClientConfigService.Config.ServerConfig,
    zip: Bun.BunFile
  ) => {
    this.__log('/upload/', { size: size_human(zip.size) });

    return fetch(
      `http://${server_config.ip}:${server_config.port}/upload/?name=${backup_name}.zip&client=${client_name}`,
      {
        method: 'POST',
        body: zip,
        headers: { 'X-Key': server_config.key },
      }
    )
      .catch(e => {
        console.log({ e });

        return null;
      })
      .then(async response => {
        return response?.status === 204 ? { ok: true } : { ok: false, response: response };
      });
  };
}
