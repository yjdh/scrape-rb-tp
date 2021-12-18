import { scrape } from "../helpers/scraper.ts";
import client from "../sql/sql.ts";
import { Client } from "https://raw.githubusercontent.com/denodrivers/mysql/8378027d8ba60ef901ca7ecaf001cf1a47651418/mod.ts";

// @deno-types="https://denopkg.com/nekobato/deno-xml-parser/index.ts"
import parse from "https://denopkg.com/nekobato/deno-xml-parser/index.ts";

//TODO: figure out how to get the Document type from the xml parser
function getSearchResultsByRanking(resText: string): Array<string> {
    const node: any = parse(resText);

    return node.root.children.map((child: any) => {
        return child.children[0].content;
    });
}

const insertRankings = async (rankings: Array<string>): Promise<void> => {
    const valuesString = rankings.reduce(
        (values: string, searchTerm: string, index: number) => {
            return values + `(${index}, "${searchTerm}")` +
                (index === rankings.length - 1 ? "" : ", ");
        },
        "",
    );

    const query = `INSERT INTO rankings (rank, url) VALUES ${valuesString};`;

    // throw away result
    await client.execute(query);
};

const fillRankings = async (): Promise<void> => {
    const res: Response = await scrape(
        "https://www.redbubble.com/sitemap/popular_searches_en_00000.xml",
    );
    const resXML: string = JSON.parse(await res.text()).content;
    const searchResults: Array<string> = getSearchResultsByRanking(resXML);

    insertRankings(searchResults);
};

// TODO: either use nonce from client that increments or make primary key the curdate+url
const insertResults = async (
    urlAndResultPairs: Array<UrlAndResult>,
): Promise<void> => {
    const valuesString = urlAndResultPairs.reduce(
        (values: string, UrlAndResult: UrlAndResult, index: number) => {
            return values + `("${UrlAndResult.url}", ${UrlAndResult.result})` +
                (index === urlAndResultPairs.length - 1 ? "" : ", ");
        },
    );

    // update rankings table with result number where url = url and date = current date
    const query =
        `INSERT into rankings (CURDATE(), url, result) values (${valuesString}) ON DUPLICATE KEY UPDATE ;`;

    // throw away result
    await client.execute(query);
};

const getUrlsWithinRange = async (
    startRank: number,
    stopRank: number,
): Promise<Array<string>> => {
    const query =
        `SELECT url FROM rankings WHERE rank >= ${startRank} AND rank <= ${stopRank}`;
    const urls: Array<object> = await client.query(query);

    const urlStrings: Array<string> = urls.map((url: any) => {
        return url["url"];
    });
    return urlStrings;
};

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

const fillResult = async (
    startRank: number,
    stopRank: number,
): Promise<void> => {
    const urls: Array<string> = await getUrlsWithinRange(startRank, stopRank);

    const urlRequests: Promise<UrlAndResult>[] = urls.map(
        async (url: string) => {
            const res: Response = await scrape(url);
            const resText: string = await res.text();
            const html: string = JSON.parse(resText)["content"];
            const result: number = extractResultNumber(html);

            const urlAndResult: UrlAndResult = {
                url,
                result,
            };
            return urlAndResult;
        },
    );

    const urlAndResultPairs = await Promise.all(urlRequests);
    //TODO: get the result number from the HTML results and insert it into the database

    insertResults(urlAndResultPairs);
};

//TODO: remove
fillResult(0, 1);

export default {
    fillRankings,
};
