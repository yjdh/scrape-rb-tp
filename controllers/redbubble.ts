import scrape from '../helpers/scraper';
import pool from '../sql/sql';

interface rankToUrl {
    rank: number;
    url: string;
}
const getSearchResultsByRanking = (resText: string): Array<rankToUrl> => {
  const resultsRegex = /<loc>(.*?)\<\/loc>/g;
  const found = resText.match(resultsRegex);

  if (!found) {
    throw new Error('Sitemap rankings not found');
  }
  const rankToResultMap: Map<string, number> = new Map();

  const rankToUrlPairs: rankToUrl[] = [];

  found.forEach((url: string, index: number) => {
    if (!rankToResultMap.has(url)) {
      rankToResultMap.set(url, index);
      const rankToUrl: rankToUrl = {
        rank: index,
        url: url.slice(5, url.length - 6),
      };
      rankToUrlPairs.push(rankToUrl);
    }
  });

  return rankToUrlPairs;
};

const insertRankings = async (
    rankToUrlPairs: Array<rankToUrl>,
): Promise<void> => {
  const date: string = new Date().toISOString().slice(0, 10);

  let values = '';
  for (const {rank, url} of rankToUrlPairs) {
    values += `("${date}", ${rank}, "${url}", "${date.concat(url)}"), `;
  }
  values = values.slice(0, -2);

  const query =
        `INSERT INTO rankings (date, rank, url, dateAndUrl) VALUES ${values};`;

  // throw away result
  pool.query(query).catch(
      (err: Error) => {
        console.log(values);
        console.log(err);
      },
  );
};

const BATCH_SIZE = 10000;
const fillRankings = async (): Promise<void> => {
  const res: string = await scrape(
      'https://www.redbubble.com/sitemap/popular_searches_en_00000.xml',
  );
  const rankToUrlPairs: Array<rankToUrl> = getSearchResultsByRanking(res);

  const batches: Array<rankToUrl[]> = [];
  for (
    let i = 0;
    i < rankToUrlPairs.length;
    i += Math.min(rankToUrlPairs.length - 1, BATCH_SIZE)
  ) {
    const batch = rankToUrlPairs.slice(
        i,
        i + Math.min(rankToUrlPairs.length - 1, BATCH_SIZE),
    );
    batches.push(batch);
  }

  const insertRankingsBatches: Promise<void>[] = batches.map((batch) => {
    return insertRankings(batch);
  });

  await Promise.all(insertRankingsBatches).catch((err: Error) => {
    console.log(err);
  });
};

const getUrlsWithinRange = async (
    startRank: number,
    stopRank: number,
): Promise<Array<string>> => {
  if (startRank > stopRank) {
    throw Error('startRank must be less than or equal to stopRank');
  }

  const query = `SELECT url 
        FROM rankings 
        WHERE rank >= ${startRank} 
        AND rank < ${stopRank}`;

  const [row] = await pool.query(query);

  if (!row || !(row instanceof Array)) {
    throw Error('unexpected results for getting rankings within range');
  }

  const urlStrings: string[] = row.map((url: any) => {
    return url['url'];
  });
  return urlStrings;
};

// get results number from print on demand website
// this is specific to redbubble currently
const extractResultNumber = (html: string): number | null => {
  const resultsRegex = /([0-9,]*) Results<\/span><\/div>/;

  // Example: 164,295 "Results</span></div>"
  const found = html.match(resultsRegex);

  if (!found || found.length < 2) {
    return null;
  }
  const foundNumber = parseInt(found[1].replace(',', ''));

  return foundNumber;
};

interface UrlAndResult {
    url: string;
    result: number;
}
const updateResult = (
    {url, result}: UrlAndResult,
): void => {
  const date: string = new Date().toISOString().slice(0, 10);
  const query =
        `UPDATE rankings SET results = ${result} WHERE dateAndUrl = "${
          date.concat(url)
        }";`;

  // throw away result
  pool.query(query);
};

const fillResults = async (
    startRank: number,
    stopRank: number,
): Promise<void> => {
  const urls: Array<string> = await getUrlsWithinRange(startRank, stopRank);

  const scrapeAndUpdateResultRequests: Promise<void>[] = urls.map(
      async (url: string) => {
        let result: number | null = null;

        // TODO: make a better retry mechanism
        for (let i = 0; i < 3; i++) {
          result = extractResultNumber(await scrape(url));
          if (result !== null) {
            break;
          }
        }
        if (result === null) {
          throw Error(
              'result extraction failed, scrape likely failed 3 times in a row',
          );
        }
        updateResult(<UrlAndResult> {url, result});
      },
  );
  await Promise.all(scrapeAndUpdateResultRequests);
};

export default {
  fillResults,
  fillRankings,
};
