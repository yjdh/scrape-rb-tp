import { Application, helpers, Router } from "https://deno.land/x/oak/mod.ts";
import redbubbleControllers from "./controllers/redbubble.ts";

const port = 8080;

const app = new Application();

const router = new Router();

router
    .get("/fillRankings", async (ctx) => {
        await redbubbleControllers.fillRankings();
        ctx.response.status = 200;
        ctx.response.body = "Rankings filled";
    })
    .get("/fillResults", async (ctx) => {
        const params: Record<string, string> = helpers.getQuery(ctx, {
            mergeParams: true,
        });

        if (!params.start || !params.stop) {
            ctx.response.status = 400;
            ctx.response.body = "start and end params are required";
            return;
        }

        const start = parseInt(params.start);
        const stop = parseInt(params.stop);

        await redbubbleControllers.fillResults(start, stop);
        ctx.response.status = 200;
        ctx.response.body = `Result ${start} to ${stop} filled`;
    })
    .get("/(.*)", async (ctx) => {
        ctx.response.status = 404;
        ctx.response.body = "404 | Page not Found";
    });

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", ({ secure, hostname, port }) => {
    const protocol = secure ? "https://" : "http://";
    const url = `${protocol}${hostname ?? "localhost"}:${port}`;
    console.log(`Listening on: ${port}`);
});

await app.listen({ port });
