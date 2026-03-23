import type {
	NotificationActor,
	NotificationTriggerSource,
} from "@dokploy/server";

type DeployJob =
	| {
			applicationId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy" | "redeploy";
			applicationType: "application";
			serverId?: string;
			actor?: NotificationActor;
			triggerSource?: NotificationTriggerSource;
	  }
	| {
			composeId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy" | "redeploy";
			applicationType: "compose";
			serverId?: string;
			actor?: NotificationActor;
			triggerSource?: NotificationTriggerSource;
	  }
	| {
			applicationId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy" | "redeploy";
			applicationType: "application-preview";
			previewDeploymentId: string;
			serverId?: string;
			actor?: NotificationActor;
			triggerSource?: NotificationTriggerSource;
	  };

export type DeploymentJob = DeployJob;
