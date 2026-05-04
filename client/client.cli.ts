export const client_cli = (commands: string[], args: Map<string, string | true>) => {
  if (commands.length !== 0) {
    process.exit(1);
  }

  if (args.has('--help') || args.has('-h')) {
    console.log(`Usage: bun client/client.ts --config <path> [options]

Options:
  -c, --config <path>    Path to config file (required)
  -h, --help             Show this help message

Examples:
  bun client/client.ts --config client.json
  bun client/client.ts -c client.json`);
    process.exit(0);
  }

  if (!args.has('--config') && !args.has('-c')) {
    console.error('ERROR: No config file specified.');
    console.error('Use --config <path> or -c <path> to specify a config file.');
    console.error('Run with --help for usage information.');

    process.exit(1);
  }
};
