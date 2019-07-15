import { flags } from "@oclif/command";

import { ProjectCommand } from "../../Command";

export default class ServiceDelete extends ProjectCommand {
  static description =
    "Delete a federated service from Engine and recompose remaining services";
  static flags = {
    ...ProjectCommand.flags,
    tag: flags.string({
      char: "t",
      hidden: true,
      description: "The variant of the service to delete",
      default: "current",
      exclusive: ["variant"]
    }),
    variant: flags.string({
      char: "v",
      description: "The variant of the service to delete",
      exclusive: ["tag"]
    }),
    federated: flags.boolean({
      char: "f",
      default: false,
      hidden: true,
      description:
        "[Deprecated: use serviceName to indicate that this is deleting a federated service] Indicates that the schema is a partial schema from a federated service"
    }),
    serviceName: flags.string({
      required: true,
      description:
        "Provides the name of the implementing service for a federated graph"
    })
  };

  async run() {
    let result;
    await this.runTasks(({ flags, project, config }) => [
      {
        title: "Removing service from Engine",
        task: async () => {
          if (!config.name) {
            throw new Error("No service found to link to Engine");
          }

          if (!flags.federated && !flags.serviceName) {
            this.error(
              "Deleting a service is only supported for federated services. Use the --serviceName flag if this is a federated service."
            );
          }

          const graphVariant = config.tag || flags.variant;

          const {
            errors,
            updatedGateway
          } = await project.engine.removeServiceAndCompose({
            id: config.name,
            graphVariant,
            name: flags.serviceName
          });

          result = {
            serviceName: flags.serviceName,
            graphVariant,
            graphName: config.name,
            errors,
            updatedGateway
          };

          return;
        }
      }
    ]);

    this.log("\n");

    if (result.errors && result.errors.length) {
      this.error(result.errors.map(error => error.message).join("\n"));
    }

    if (result.updatedGateway) {
      this.log(
        `The ${result.serviceName} service with ${
          result.graphVariant
        } tag was removed from ${
          result.graphName
        }. Remaining services were composed.`
      );
      this.log("\n");
    }
  }
}
