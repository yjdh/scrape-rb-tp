import { scrape } from "../helpers/scraper.ts";
import client from "../sql/sql.ts";
import { Client } from "https://raw.githubusercontent.com/denodrivers/mysql/8378027d8ba60ef901ca7ecaf001cf1a47651418/mod.ts";

// @deno-types="https://denopkg.com/nekobato/deno-xml-parser/index.ts"
import parse from "https://denopkg.com/nekobato/deno-xml-parser/index.ts";

//TODO: figure out how to get the Document type from the xml parser
function getSearchResultsByRanking(resText:string): Array<string>{
    const node:any = parse(resText);

    return node.root.children.map((child: any) => {
        return child.children[0].content;
    });
}

const insertRankings = async (client: Client, rankings: Array<string>):Promise<void> => {    
    const valuesString = rankings.reduce((values:string, searchTerm:string, index:number) => {
      return values + `(${index}, "${searchTerm}")` + (index === rankings.length - 1 ? "" : ", ");
    }, "");

    const query = `INSERT INTO rankings (rank, url) VALUES ${valuesString};`;
    
    // throw away result
    await client.execute(query);
}

const fillRankings = async ():Promise<void> => {
    const res:Response = await scrape("https://www.redbubble.com/sitemap/popular_searches_en_00000.xml");
    const resXML:string = JSON.parse(await res.text()).content;
    const searchResults:Array<string> = getSearchResultsByRanking(resXML);

    insertRankings(client, searchResults);
}

const getSearchTerms = async (client: Client, startRank:number, stopRank:number):Promise<void> => {    
    const query = `SELECT url FROM rankings WHERE rank >= ${startRank} AND rank <= ${stopRank}`;
    const urls = await client.query(query);

    console.log(urls);
    // throw away result
    return urls;
}

// const fillResults = async ():Promise<void> => {
//     const res:Response = await scrape("https://www.redbubble.com/sitemap/popular_searches_en_00000.xml");
//     const resText:string = await res.text();
//     console.log("\n==RES TEXT==="+resText+"\n");

//     //const searchResults:Array<string> = getSearchResultsByRanking(resText);


//     //insertRankings(client, searchResults);
// }

//TODO: remove
fillRankings();

export default {
    fillRankings,
};