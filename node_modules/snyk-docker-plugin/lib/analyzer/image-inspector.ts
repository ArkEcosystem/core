import { Docker, DockerOptions } from "../docker";

export { detect };
interface Inspect {
  Id: string;
  RootFS: {
    Type: string;
    Layers: string[];
  };
}

async function detect(
  targetImage: string,
  options?: DockerOptions,
): Promise<Inspect> {
  try {
    const info = await new Docker(targetImage, options).inspect(targetImage);
    return JSON.parse(info.stdout)[0];
  } catch (error) {
    if (error.stderr.includes("No such object")) {
      throw new Error(
        `Docker error: image was not found locally: ${targetImage}`,
      );
    }
    throw new Error(`Docker error: ${error.stderr}`);
  }
}
