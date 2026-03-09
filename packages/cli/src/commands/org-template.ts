/**
 * org-template command
 *
 * Generates a YAML org chart template for users to fill in.
 * Output can be piped to a file: npx agentlaunch org-template --size smb > people.yaml
 */

import { Command } from "commander";
import { generateOrgTemplate } from "agentlaunch-templates";

export function registerOrgTemplateCommand(program: Command): void {
  program
    .command("org-template")
    .description("Generate an org chart template for swarm deployment")
    .option("--size <size>", "Organization size: startup, smb, enterprise", "smb")
    .action((options: { size: string }) => {
      const validSizes = ["startup", "smb", "enterprise"];
      const size = options.size.toLowerCase();

      if (!validSizes.includes(size)) {
        console.error(`Invalid size: ${size}. Use one of: ${validSizes.join(", ")}`);
        process.exit(1);
      }

      const template = generateOrgTemplate(size as "startup" | "smb" | "enterprise");
      console.log(template);
    });
}
