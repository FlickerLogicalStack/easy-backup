import { create_hub } from './server.hub';
import { log } from '../shared/utils/log';
import { server_cli } from './server.cli';

export class App {
  public readonly hub = create_hub();

  init = async () => {
    try {
      for (const service of this.hub.services) {
        const start = performance.now();

        // @ts-ignore
        await service.start();

        const end = performance.now();

        await log.server('[SERVICE:START]', `(HUB)`, service.name, Math.ceil(end - start), 'ms');
      }
    } catch (e) {
      await log.server('[SERVICE:UNEXPECTED_ERROR]', e);

      for (const service of [...this.hub.services].reverse()) {
        const start = performance.now();

        if ('shutdown' in service) {
          // @ts-ignore
          await service.shutdown();
        }

        const end = performance.now();

        await log.server('[SERVICE:SHUTDOWN]', `(HUB)`, service.name, Math.ceil(end - start), 'ms');
      }
    }
  };
}

const app = new App();

const cli = app.hub.get('CLI');

const { commands, args } = cli.extract_to(process.argv, cli.commands, cli.args);

server_cli(commands, args);

app.init();
