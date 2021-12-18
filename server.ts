import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import redbubbleControllers from "./controllers/redbubble.ts";

const port = 8080;

const app = new Application();

const router = new Router();

app.use(router.routes());
app.use(router.allowedMethods());

router
    .get("/fillRankings", redbubbleControllers.fillRankings);

app.addEventListener("listen", ({ secure, hostname, port }) => {
    const protocol = secure ? "https://" : "http://";
    const url = `${protocol}${hostname ?? "localhost"}:${port}`;
    console.log(`Listening on: ${port}`);
});

await app.listen({ port });
