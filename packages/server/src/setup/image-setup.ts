import { pullImage, pullRemoteImage } from "../utils/docker/utils";
import { getRemoteDocker } from "../utils/servers/remote-docker";

export const hasImage = async (imageName: string, serverId?: string | null) => {
	const remoteDocker = await getRemoteDocker(serverId);

	try {
		await remoteDocker.getImage(imageName).inspect();
		return true;
	} catch {
		return false;
	}
};

export const ensureImage = async (
	imageName: string,
	serverId?: string | null,
	onData?: (data: any) => void,
) => {
	if (!imageName) {
		throw new Error("Docker image not found");
	}

	const imageExists = await hasImage(imageName, serverId);
	if (imageExists) {
		console.log(`Docker image already exists: ${imageName}`);
		return;
	}

	if (serverId) {
		await pullRemoteImage(imageName, serverId, onData);
		return;
	}

	await pullImage(imageName, onData);
};
