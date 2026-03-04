import {
    createHostingSlug,
    fetchBlobFromUrl, getHostedUrl,
    getImageExtension,
    HOSTING_CONFIG_KEY,
    imageUrlToPngBlob,
    isHostedUrl
} from "./utils";
import puter from "@heyputer/puter.js";

/**
 * Retrieves the hosting config (subdomain) from Puter KV store,
 * or creates a new one if none exists.
 *
 * - Returns cached subdomain immediately if already stored
 * - Generates a new slug and registers it via puter.hosting.create()
 * - Returns null if hosting creation fails
 */
export const getOrCreateHostingConfig = async () : Promise<HostingConfig | null> => {
    const existing = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;
    if (existing?.subdomain) return { subdomain: existing.subdomain }

    const subdomain = createHostingSlug();

    try {
        const created = await puter.hosting.create(subdomain, ".");

         return {subdomain: created.subdomain};

    }catch (e){
        console.warn(`could not find subdomain: ${e}`);
        return null;
    }
};

/**
 * Uploads an image to the Puter hosted file system and returns a public URL.
 *
 * - Skips upload if the URL is already hosted
 * - Converts to PNG if label is "rendered", otherwise fetches as-is
 * - Builds path as: projects/{projectId}/{label}.{ext}
 * - Returns null if inputs are missing, blob resolution fails, or upload errors
 */
export const uploadImageToHosting = async ({hosting , url , projectId , label} :
                                           StoreHostedImageParams) : Promise<HostedAsset | null> => {
    if(!hosting || !url) return null;
    if(isHostedUrl(url)) return {url};

    try{
        const resolved = label === "rendered" ? await imageUrlToPngBlob(url).
            then((blob) => blob ? {blob, contentType: "image/png"} : null)
            : await fetchBlobFromUrl(url);

        if(!resolved) return null;

        const contentType = resolved.contentType || resolved.blob.type || "";
        const ext = getImageExtension(contentType, url);
        const dir = `projects/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        const uploadFile = new File([resolved.blob] , `${label}.${ext}`, {type : contentType});

        await puter.fs.mkdir(dir, {createMissingParents: true});
        await puter.fs.write(filePath, uploadFile);

        const hostedUrl = getHostedUrl({subdomain: hosting.subdomain}, filePath);

        return hostedUrl ? {url: hostedUrl} : null;
    }catch(e){
        console.warn(`Failed to store the hosted image: ${e}`);
        return null;
    }
}