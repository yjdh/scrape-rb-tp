import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const SCRAPING_BEE_KEY: string | undefined = process.env.SCRAPING_BEE_KEY;
const SCRAPER_API_KEY: string | undefined = process.env.SCRAPER_API_KEY;

if (
  !SCRAPING_BEE_KEY || !(typeof SCRAPER_API_KEY === 'string') ||
    !SCRAPER_API_KEY || !(typeof SCRAPER_API_KEY === 'string')
) {
  throw new Error('SCRAPING API KEYS ARE not set');
}

/**
 * Scrapes the page using ScrapingBee API and returns the results
 * @param {string} url the url to scrape
 * @return {string} content from scraped page
 */
const scrape = async (url: string): Promise<string> => {
  const scrapingUrl =
        `https://api.scrapingant.com/v1/general?url=${url}&browser=false`;
  const res = await fetch(scrapingUrl, {
    method: 'GET',
    headers: {
      'x-api-key': SCRAPING_BEE_KEY,
    },
  });

  const json = await res.json();

  if (!(json.hasOwnProperty('content'))) {
    return '';
  }

  return json['content'];
};

export default scrape;
