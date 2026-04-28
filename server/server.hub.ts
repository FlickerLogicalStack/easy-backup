import { log } from '../shared/utils/log';
import { ServerConfigService } from './services/ServerConfigService';
import { ServicesHub } from '../shared/ServicesHub';
import { WebserverService } from './services/WebserverService';

export const create_hub = () => {
  const logger = log.server;

  return new ServicesHub()
    .add(() => new ServerConfigService().withLogger(logger))
    .add(hub => new WebserverService(hub.get('ServerConfig')).withLogger(logger));
};
