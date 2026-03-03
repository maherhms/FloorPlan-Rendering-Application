export const HOSTING_CONFIG_KEY = "raumorph_hosting_config";
export const HOSTING_DOMAIN_SUFFIX = ".puter.site";

/**
 * ### Purpose
 * Checks if URL already belongs to your hosting domain.
 *
 * ### Why
 * Prevents re-uploading images that are already hosted.
 * @param value
 */
export const isHostedUrl = (value: unknown): value is string =>
    typeof value === "string" && value.includes(HOSTING_DOMAIN_SUFFIX);

/**
 * Generate a random subdomain name for hosting
 * - Date.now() → uniqueness over time
 * - Math.random() → collision prevention
 * - base36 → shorter string
 */
export const createHostingSlug = () =>
    `raumorph-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

/** if subdomain is not ending with HOSTING_DOMAIN_SUFFIX, add it at the end of the subdomain*/
const normalizeHost = (subdomain: string) =>
    subdomain.endsWith(HOSTING_DOMAIN_SUFFIX)
        ? subdomain
        : `${subdomain}${HOSTING_DOMAIN_SUFFIX}`;
/**
 * Build and return a host url made of the subdomain and the path to the file.
 * @param hosting
 * @param filePath
 */
export const getHostedUrl = (
    hosting: { subdomain: string },
    filePath: string,
): string | null => {
    if (!hosting?.subdomain) return null;
    const host = normalizeHost(hosting.subdomain);
    return `https://${host}/${filePath}`;
};

/**
 * Determines a safe and normalized image file extension.
 *
 * Detection priority:
 * 1. Content-Type header (e.g. "image/jpeg")
 * 2. Data URL prefix (e.g. "data:image/png;base64,...")
 * 3. File extension from URL (handles query/hash params)
 * 4. Defaults to "png" if none found
 *
 * Also normalizes:
 * - "jpeg" → "jpg"
 * - "svg+xml" → "svg"
 *
 * This ensures consistent and reliable file extensions
 * even when headers or URLs are missing or incorrect.
 */
export const getImageExtension = (contentType: string, url: string): string => {
    const type = (contentType || "").toLowerCase();
    const typeMatch = type.match(/image\/(png|jpe?g|webp|gif|svg\+xml|svg)/);
    if (typeMatch?.[1]) {
        const ext = typeMatch[1].toLowerCase();
        return ext === "jpeg" || ext === "jpg"
            ? "jpg"
            : ext === "svg+xml"
                ? "svg"
                : ext;
    }

    const dataMatch = url.match(/^data:image\/([a-z0-9+.-]+);/i);
    if (dataMatch?.[1]) {
        const ext = dataMatch[1].toLowerCase();
        return ext === "jpeg" ? "jpg" : ext;
    }

    const extMatch = url.match(/\.([a-z0-9]+)(?:$|[?#])/i);
    if (extMatch?.[1]) return extMatch[1].toLowerCase();

    return "png";
};

/**
 * Converts a data URL (e.g. "data:image/png;base64,...")
 * into a Blob object.
 *
 * Steps:
 * 1. Extracts content type and encoding info from the data URL
 * 2. Detects whether the payload is base64 or URL-encoded
 * 3. Decodes the data into raw binary
 * 4. Converts binary into Uint8Array
 * 5. Creates and returns a Blob with the correct MIME type
 *
 * Returns:
 * - { blob, contentType } on success
 * - null if parsing fails
 */
export const dataUrlToBlob = (
    dataUrl: string,
): { blob: Blob; contentType: string } | null => {
    try {
        const match = dataUrl.match(/^data:([^;]+)?(;base64)?,([\s\S]*)$/i);
        if (!match) return null;
        const contentType = match[1] || "";
        const isBase64 = !!match[2];
        const data = match[3] || "";
        const raw = isBase64
            ? atob(data.replace(/\s/g, ""))
            : decodeURIComponent(data);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) {
            bytes[i] = raw.charCodeAt(i);
        }
        return { blob: new Blob([bytes], { type: contentType }), contentType };
    } catch {
        return null;
    }
};

/**
 * Fetches an image from a URL and converts it into a Blob.
 *
 * Handles two cases:
 * 1. If the URL is a data URL → delegates to dataUrlToBlob()
 * 2. If it's a remote URL → fetches it via HTTP
 *
 * Returns:
 * - { blob, contentType } on success
 * - null if fetching fails
 */
export const fetchBlobFromUrl = async (
    url: string,
): Promise<{ blob: Blob; contentType: string } | null> => {
    if (url.startsWith("data:")) {
        return dataUrlToBlob(url);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        return {
            blob: await response.blob(),
            contentType: response.headers.get("content-type") || "",
        };
    } catch {
        return null;
    }
};

/**
 * Loads an image from a URL and converts it into a PNG Blob
 * using a canvas.
 *
 * Steps:
 * 1. Creates an Image element
 * 2. Waits for it to fully load
 * 3. Draws the image onto a canvas
 * 4. Converts the canvas content into a PNG Blob
 *
 * Returns:
 * - PNG Blob on success
 * - null if loading or conversion fails
 *
 * Used to normalize rendered images into PNG format.
 */
export const imageUrlToPngBlob = async (url: string): Promise<Blob | null> => {
    if (typeof window === "undefined") return null;

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url;
        });

        const width = loaded.naturalWidth || loaded.width;
        const height = loaded.naturalHeight || loaded.height;
        if (!width || !height) return null;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(loaded, 0, 0, width, height);

        return await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), "image/png");
        });
    } catch {
        return null;
    }
};