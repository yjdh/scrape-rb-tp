import { scrape } from "../helpers/scraper.ts";
import client from "../sql/sql.ts";
import { Client } from "https://raw.githubusercontent.com/denodrivers/mysql/8378027d8ba60ef901ca7ecaf001cf1a47651418/mod.ts";
// @deno-types="https://denopkg.com/nekobato/deno-xml-parser/index.ts"
import parse from "https://denopkg.com/nekobato/deno-xml-parser/index.ts";

const BATCH_SIZE = 10000;

interface rankToUrl {
    rank: number;
    url: string;
}
//TODO: figure out how to get the Document type from the xml parser
function getSearchResultsByRanking(resText: string): Array<rankToUrl> {
    const node: any = parse(resText);
    const rankToResultMap: Map<string, number> = new Map();

    const rankToUrlPairs: Array<rankToUrl> = new Array<rankToUrl>();

    // needs to be a tuple to ensure we keep order even if we slice the array for batching the inserts to the db
    node.root.children.forEach((child: any, index: number) => {
        if (!rankToResultMap.has(child.children[0].content)) {
            rankToResultMap.set(child.children[0].content, index);
            const rankToUrl: rankToUrl = {
                rank: index,
                url: child.children[0].content,
            };
            rankToUrlPairs.push(rankToUrl);
        }
    });

    return rankToUrlPairs;
}

const insertRankings = async (
    rankToUrlPairs: Array<rankToUrl>,
): Promise<void> => {
    const date: string = new Date().toISOString().slice(0, 10);

    let values = "";
    for (const { rank, url } of rankToUrlPairs) {
        values += `("${date}", ${rank}, "${url}", "${date.concat(url)}"), `;
    }
    values = values.slice(0, -2);

    const query =
        `INSERT INTO rankings (date, rank, url, dateAndUrl) VALUES ${values};`;
    await Deno.writeTextFile("values", values);

    // throw away result
    await client.execute(query).catch(
        (err) => {
            console.error(err);
        },
    );
};

const fillRankings = async (): Promise<void> => {
    const res: string = await scrape(
        "https://www.redbubble.com/sitemap/popular_searches_en_00000.xml",
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

    Promise.all(insertRankingsBatches).catch((err: Error) => {
        console.log(err);
    });
};

const getUrlsWithinRange = async (
    startRank: number,
    stopRank: number,
): Promise<Array<string>> => {
    if (startRank > stopRank) {
        throw Error("startRank must be less than or equal to stopRank");
    }

    const query =
        `SELECT url FROM rankings WHERE rank >= ${startRank} AND rank <= ${stopRank}`;
    const urls: Array<object> = await client.query(query);

    const urlStrings: Array<string> = urls.map((url: any) => {
        return url["url"];
    });
    return urlStrings;
};

// get results number from print on demand website
// this is specific to redbubble currently
const extractResultNumber = (html: string): number => {
    const resultsRegex = /([0-9,]*) Results<\/span><\/div>/;

    // Example: 164,295 "Results</span></div>"
    const found = html.match(resultsRegex);

    if (!found || found.length < 2) {
        throw new Error("Could not find result number");
    }
    const foundNumber = parseInt(found[1].replace(",", ""));

    return foundNumber;
};

interface UrlAndResult {
    url: string;
    result: number;
}

const updateResult = (
    { url, result }: UrlAndResult,
): void => {
    const date: string = new Date().toISOString().slice(0, 10);
    const query =
        `UPDATE rankings SET results = ${result} WHERE dateAndUrl = "${
            date.concat(url)
        }";`;

    // throw away result
    client.execute(query);
};

const fillResults = async (
    startRank: number,
    stopRank: number,
): Promise<void> => {
    const urls: Array<string> = await getUrlsWithinRange(startRank, stopRank);

    const scrapeAndUpdateResultRequests: Promise<void>[] = urls.map(
        async (url: string) => {
            const res: string = await scrape(url);

            const result: number = extractResultNumber(res);
            updateResult({ url, result });
        },
    );
    await Promise.all(scrapeAndUpdateResultRequests);
};

export default {
    fillResults,
    fillRankings,
};
