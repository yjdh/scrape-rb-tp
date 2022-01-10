import "https://deno.land/x/dotenv/load.ts";
import { encodeUrl } from "https://deno.land/x/encodeurl/mod.ts";

const SCRAPING_BEE_KEY = <string> Deno.env.get("SCRAPING_BEE_KEY");
const SCRAPER_API_KEY = <string> Deno.env.get("SCRAPER_API_KEY");

if (!SCRAPING_BEE_KEY || !SCRAPER_API_KEY) {
    throw new Error("SCRAPING API KEYS ARE not set");
}

const scrapingbee = async (url: string): Promise<string> => {
    const encodedUrl = encodeUrl(url);
    const scrapingUrl =
        `https://api.scrapingant.com/v1/general?url=${encodedUrl}&browser=false`;
    const res = await fetch(scrapingUrl, {
        method: "GET",
        headers: {
            "x-api-key": SCRAPING_BEE_KEY,
        },
    });

    return JSON.parse(await res.text())["content"];
};

// const scraperapi = async (url: string):Promise<string> => {
//     const encodedUrl = encodeUrl(url);
//     const scrapingUrl =
//         `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodedUrl}`;
//     const res = await fetch(scrapingUrl, {
//         method: "GET",
//     });

//     const text = await res.text()

//     return JSON.parse(text);
// }

export async function scrape(
    url: string,
): Promise<string> {
    // return await scraperapi(url);
    return await scrapingbee(url);
}
