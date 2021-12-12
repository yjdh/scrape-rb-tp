import "https://deno.land/x/dotenv/load.ts";
import { encodeUrl } from "https://deno.land/x/encodeurl/mod.ts";

const SCRAPING_KEY = <string>Deno.env.get("SCRAPING_KEY");

if (!SCRAPING_KEY) {
  throw new Error("SCRAPER_FLY_KEY is not set");
}

export async function scrape(url:string):Promise<Response> {
    const encodedUrl = encodeUrl(url);
    const options = `&proxy_country=US&browser=false`;
    const scrapflyURL =`https://api.scrapingant.com/v1/general?url=${encodedUrl}${options}`;
    return await fetch(scrapflyURL, {
      method: 'GET',
      headers: {
       "x-api-key": SCRAPING_KEY,
       "useQueryString": "true"
      },
    });
}
