const PROJECT_PREFIX = "raumorph_project_";

/**
 * Creates a JSON error response with the given status code and message.
 * Spreads any extra fields (e.g. { message }) into the response body.
 */
const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({error : message, ...extra}), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    })
}

const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();
        return user?.uuid || null;
    }catch {
        return null;
    }
}

/**
 * POST /api/projects/save
 * Saves a project. Returns 500 JSON error on failure.
 */
router.post("/api/projects/save", async ({request , user}) => {
    try {
        const userPuter = user.puter;

        if(!userPuter) return jsonError(401, "Authentication failed");

        const body = await request.json();
        const project = body?.project;

        if(!project?.id || !project?.sourceImage) return jsonError(400, "Project not found");

        const payload = {
            ...project,
            updatedAt : new Date().toISOString(),
        }

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, "Authentication failed");

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return { saved : true, id : project.id, project : payload};
    }catch (e) {
        return jsonError ( 500, "Failed to save the project", { message: e.message || "unknown error"});
    }
})

/**
 * GET /api/projects/list
 * Lists all projects. Returns 500 JSON error on failure.
 */
router.get("/api/projects/list", async ({user}) => {
    try {
        const userPuter = user.puter;
        if(!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, "Authentication failed");

        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
            .map(({value}) => ({...value , isPublic: true}))

        return {projects};
    }catch (e) {
        return jsonError(500, "Failed to list projects", { message: e.message || "unknown error"});
    }
})

/**
 * GET /api/projects/get
 * Fetches a project by id. Returns 500 JSON error on failure.
 */
router.get("/api/projects/get", async ({request, user}) => {
    try {
        const userPuter = user.puter;
        if(!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, "Authentication failed");

        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if(!id) return jsonError(400, "Project ID is required");

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if(!project) return jsonError(404, "Project not found");

        return { project };
    }catch (e) {
        return jsonError(500, "Failed to fetch project", { message: e.message || "unknown error"});
    }
})