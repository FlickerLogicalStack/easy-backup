export class ServicesHub<TServices extends ServicesHub.Service<string> = never> {
  public readonly services: TServices[] = [];

  add = <TService extends ServicesHub.Service<string>>(service: (hub: this) => TService) => {
    (this.services as (TServices | TService)[]).push(service(this));

    return this as ServicesHub<TServices | TService>;
  };

  get = <TName extends TServices['name']>(name: TName) => {
    const service = this.services.find(service => service.name === name);

    return service as Extract<TServices, ServicesHub.Service<TName>>;
  };
}

export namespace ServicesHub {
  export class Service<TName extends string> {
    constructor(public readonly name: TName) {}

    protected __log = async (..._data: any[]) => {};

    public withLogger = (logger: (...args: any[]) => Promise<any>) => {
      this.__log = (...args: any[]) => logger(`[SERVICE: INFO] (${this.name})`, ...args);

      return this;
    };

    protected start: () => void | Promise<void> = () => {};

    protected shutdown: () => void | Promise<void> = () => {};
  }
}
