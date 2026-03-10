import puter from "@heyputer/puter.js";
import {RAUMORPH_RENDER_PROMPT} from "./constants";

/**
 * Fetches a resource from a URL and converts it into a Data URL.
 *
 * Steps:
 * 1. Fetches the resource via HTTP
 * 2. Throws an error if the response is not OK
 * 3. Converts the response body into a Blob
 * 4. Uses a FileReader to read the Blob as a Data URL
 * 5. Returns a Promise that resolves with the Data URL or rejects on error
 *
 * @param url The URL of the resource to fetch
 * @returns A Promise resolving to the Data URL string
 */
export async function fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to convert blob to Data URL"));
            }
        };
        reader.onerror = () => {
            reject(new Error("Error reading blob as Data URL"));
        };
        reader.readAsDataURL(blob);
    });
}

export const generate3DView = async ({sourceImage} : Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith("data:") ? sourceImage : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];

    if(!mimeType || !base64Data){
        throw new Error("Invalid source image payload");
    }

    const response = await puter.ai.txt2img(RAUMORPH_RENDER_PROMPT,{
        model: "black-forest-labs/flux.2-klein-9b",
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio : {w: 1024, h: 1024},
    })

    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if(!rawImageUrl) return { renderedImage : null , renderedPath : undefined };

    const renderedImage = rawImageUrl.startsWith("data:") ? rawImageUrl : await fetchAsDataUrl(rawImageUrl);

    return { renderedImage , renderedPath : undefined };
}
