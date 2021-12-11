import { scrape } from "../helpers/scraperapi.ts";

// @deno-types="https://denopkg.com/nekobato/deno-xml-parser/index.ts"
import parse from "https://denopkg.com/nekobato/deno-xml-parser/index.ts";


//TODO: figure out how to get the Document type from the xml parser
function getSearchResultsByRanking(resText:string): Array<String>{
    const node:any = parse(resText);

    return node.root.children.map((child: any) => {
        return child.children[0].content;
    });
}

async function fillRankings():Promise<void>{
    const res:Response = await scrape("https://www.redbubble.com/sitemap/popular_searches_en_00000.xml");
    const resText:string = await res.text();

    const searchResults:Array<String> = getSearchResultsByRanking(resText);
}

export default {
    fillRankings,
};