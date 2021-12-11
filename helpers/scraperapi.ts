import "https://deno.land/x/dotenv/load.ts";

const SCRAPER_API_KEY = Deno.env.get("SCRAPER_API_KEY");

export async function scrape(url:string):Promise<Response> {
    return await fetch(`https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${url}`)
}