import { create_hub } from './client.hub';
import { log } from '../shared/utils/log';
import { client_cli } from './client.cli';

export class App {
  public readonly hub = create_hub();

  init = async () => {
    try {
      for (const service of this.hub.services) {
        const start = performance.now();

        // @ts-ignore
        await service.start();

        const end = performance.now();

        await log.client('[SERVICE:START]', `(HUB)`, service.name, Math.ceil(end - start), 'ms');
      }
    } catch (e) {
      log.client('[SERVICE:UNEXPECTED_ERROR]', e);

      for (const service of [...this.hub.services].reverse()) {
        const start = performance.now();

        if ('shutdown' in service) {
          // @ts-ignore
          await service.shutdown();
        }

        const end = performance.now();

        await log.client('[SERVICE:SHUTDOWN]', `(HUB)`, service.name, Math.ceil(end - start), 'ms');
      }
    }
  };
}

const app = new App();

const cli = app.hub.get('CLI');

const { commands, args } = cli.extract_to(process.argv, cli.commands, cli.args);

client_cli(commands, args);

app.init();
