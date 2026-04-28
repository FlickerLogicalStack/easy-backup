import { create_hub } from './client.hub';
import { log } from '../shared/utils/log';

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

app.init();
