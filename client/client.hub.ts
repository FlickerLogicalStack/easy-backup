import { APIService } from './services/APIService';
import { BackupService } from './services/BackupService';
import { ClientConfigService } from './services/ClientConfigService';
import { log } from '../shared/utils/log';
import { ServicesHub } from '../shared/ServicesHub';

export const create_hub = () => {
  const logger = log.client;

  return new ServicesHub()
    .add(() => new ClientConfigService().withLogger(logger))
    .add(hub => new APIService(hub.get('ClientConfig')).withLogger(logger))
    .add(hub => new BackupService(hub.get('ClientConfig'), hub.get('API')).withLogger(logger));
};
