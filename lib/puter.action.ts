import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";
import {PUTER_WORKER_URL} from "./constants";
import {toast} from "react-toastify";

export const signIn = async () => await puter.auth.signIn();

export const signOut =  () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try{
        return await puter.auth.getUser();
    }
    catch{
        return null;
    }
}

export const createProject = async ({ item , visibility = "private"}: CreateProjectParams):
    Promise<DesignItem | null | undefined> => {
    if(!PUTER_WORKER_URL){
        toast.warn("missing VITE_PUTER_WORKER_URL; skip history fetch;");
        return null;
    }

    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ? await uploadImageToHosting({
        hosting,
        url: item.sourceImage,
        projectId,
        label: "source"
    }) : null;

    const hostedRendered = projectId && item.renderedImage ? await uploadImageToHosting({
        hosting,
        url: item.renderedImage,
        projectId,
        label: "rendered"
    }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage) ? item.sourceImage : "");

    if(!resolvedSource){
        toast.warn(`Failed to host source image , skipping save.`);
        return null;
    }

    const resolvedRender = hostedRendered?.url ?
        hostedRendered?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage : undefined;

    const {
        sourcePath : _sourcePath,
        renderedPath : _renderedPath,
        publicPath : _publicPath,
        ...rest
    } = item

    const payload = {
        ...rest,
        sourceImage : resolvedSource,
        renderedImage : resolvedRender,
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({project: payload, visibility}),
        });

        if(!response.ok){
            toast.error(`Failed to save the project ${await response.text()}`);
            return null;
        }

        const data = (await response.json()) as { project ?: DesignItem | null};

        return data?.project ?? null;
    }catch(e){
        toast.info(`Failed to save the project: ${e}`);
        return null;
    }
}

export const getProjects = async() => {
    if(!PUTER_WORKER_URL){
        toast.warn("missing VITE_PUTER_WORKER_URL; skip history fetch;");
        return [];
    }
    try{
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, { method : "GET"});
        if(!response.ok){
            toast.error(`Failed to fetch projects : ${await response.text()}`);
            return [];
        }

        const data = (await response.json()) as {projects? : DesignItem[] | null};
        return Array.isArray(data?.projects) ? data.projects : [];
    }catch (e){
        toast.warn(`Failed to fetch projects: ${e}`);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    if (!PUTER_WORKER_URL) {
        toast.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    toast.info(`Fetching project with ID:${id}`);

    try {
        const response = await puter.workers.exec(
            `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
            { method: "GET" },
        );

        toast.info(`Fetch project response: ${response}`);

        if (!response.ok) {
            toast.error(`Failed to fetch project: ${await response.text()}`);
            return null;
        }

        const data = (await response.json()) as {
            project?: DesignItem | null;
        };

        toast.info(`Fetched project data: ${data}`);

        return data?.project ?? null;
    } catch (error) {
        toast.error(`Failed to fetch project:${error}`);
        return null;
    }
};

export const renameProjectById = async ( newName = "untitled", {project} : {project : DesignItem | null}) => {
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({project: {...project, name: newName}}),
        });

        if(!response.ok){
            toast.error(`Failed to save the project ${await response.text()}`);
            return null;
        }

        const data = (await response.json()) as { project ?: DesignItem | null};

        toast.success(`Project renamed to ${newName}`);

        return data?.project ?? null;
    }catch (error){
        toast.error(`Failed to rename the project: ${error}`);
        return null;
    }
}