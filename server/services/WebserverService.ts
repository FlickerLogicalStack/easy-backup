import { serve, type MaybePromise } from 'bun';
import path from 'path';

import { ServicesHub } from '../../shared/ServicesHub';
import { size_human } from '../../shared/utils/size_human';
import type { ServerConfigService } from './ServerConfigService';

type Handler<Req extends Request, S, Res> = (request: Req, server: S) => MaybePromise<Res>;

const EC = {
  BAD_KEY: 1,
  BAD_BODY: 2,
  BAD_CLIENT: 3,
  BAD_NAME: 4,
};

export class WebserverService extends ServicesHub.Service<'Webserver'> {
  server!: Bun.Server<undefined>;

  config!: ServerConfigService.Config.Root;

  constructor(private readonly _server_config: ServerConfigService) {
    super('Webserver');
  }

  override start = async () => {
    this.config = this._server_config.config;

    this.server = serve({
      port: this._server_config.config.server.port,
      development: process.env.NODE_ENV !== 'production',
      maxRequestBodySize: 1024 * 1024 * 1024,
      routes: {
        '/ping/': {
          GET: WebserverService.lookup_request(
            (req, server) => this.__log('/ping/', server.requestIP(req)),
            () => new Response(null, { status: 204 })
          ),
        },
        '/upload/': {
          POST: WebserverService.lookup_request(
            req =>
              this.__log(
                req.url,
                `X-Key: ${req.headers.get('X-Key')}`,
                'Size:',
                size_human(Number(req.headers.get('Content-Length')))
              ),
            this.upload
          ),
        },
      },
    });

    this.__log(`🚀 Server running at ${this.server.url}`);
  };

  override shutdown = async () => {
    await this.server?.stop(true);
  };

  private static lookup_request =
    <TRequest extends Bun.BunRequest, TServer extends Bun.Server<any>>(
      lookup: (request: TRequest, server: TServer) => void,
      handler: Handler<TRequest, TServer, Response>
    ) =>
    (request: TRequest, server: TServer) => (lookup(request, server), handler(request, server));

  private static error = (code: number, status: number) => Response.json({ ok: false, error_code: code }, { status });

  private static ok = () => new Response(null, { status: 204 });

  private upload = async (req: Bun.BunRequest<'/upload/'>) => {
    if (req.headers.get('X-Key') !== this.config.server.key) {
      this.__log(EC.BAD_KEY);
      return WebserverService.error(EC.BAD_KEY, 403);
    }

    if (!req.body) {
      this.__log(EC.BAD_BODY);
      return WebserverService.error(EC.BAD_BODY, 400);
    }

    const url = new URL(req.url);

    const file_client = url.searchParams.get('client');
    if (!file_client) {
      this.__log(EC.BAD_CLIENT);
      return WebserverService.error(EC.BAD_CLIENT, 400);
    }

    const file_name = url.searchParams.get('name');
    if (!file_name) {
      this.__log(EC.BAD_NAME);
      return WebserverService.error(EC.BAD_NAME, 400);
    }

    const destination_path = path.join(this.config.server.root_folder, file_client, file_name);

    const body_bytes = await req.bytes();

    await Bun.write(destination_path, body_bytes);

    this.__log({ client: file_client, name: file_name });

    return WebserverService.ok();
  };
}

export namespace WebserverService {
  export const ERROR_CODES = EC;
}
