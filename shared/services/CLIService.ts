import { ServicesHub } from '../ServicesHub';

export class CLIService extends ServicesHub.Service<'CLI'> {
  constructor() {
    super('CLI');
  }

  public readonly commands: string[] = [];
  public readonly args = new Map<string, string | true>();

  public extract_to = (argv: string[], dst_commands: string[], dst_args: Map<string, string | true>) => {
    argv = argv.slice(2);

    const length = argv.length;

    if (length === 0) {
      return { commands: dst_commands, args: dst_args };
    }

    let start_of_args_index = 0;
    while (!argv[start_of_args_index]!.startsWith('-')) {
      dst_commands.push(argv[start_of_args_index]!);
      start_of_args_index++;
    }

    for (let i = 0; i < length; i++) {
      const arg = argv[i]!;

      if (arg.startsWith('-')) {
        const eq_index = arg.indexOf('=');

        if (eq_index !== -1) {
          dst_args.set(arg.slice(0, eq_index), arg.slice(eq_index + 1));
        } else {
          const next_arg = argv[i + 1];

          if (next_arg !== undefined) {
            if (!next_arg.startsWith('-')) {
              dst_args.set(arg, next_arg);
              i++;
            } else {
              dst_args.set(arg, true);
            }
          } else {
            dst_args.set(arg, true);
          }
        }
      }
    }

    return { commands: dst_commands, args: dst_args };
  };

  override start = () => {};
}
