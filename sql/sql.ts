import { Client } from "https://raw.githubusercontent.com/denodrivers/mysql/8378027d8ba60ef901ca7ecaf001cf1a47651418/mod.ts";
import "https://deno.land/x/dotenv/load.ts";

const DB_NAME:string|undefined = Deno.env.get("DB_NAME");
const DB_USERNAME:string|undefined = Deno.env.get("DB_USERNAME");
const DB_HOST:string|undefined = Deno.env.get("DB_HOST");
const DB_PASSWORD:string|undefined = Deno.env.get("DB_PASSWORD");

if (!DB_NAME || !DB_USERNAME || !DB_HOST || !DB_PASSWORD) {
  throw new Error("Please set up your database credentials in .env file");
}

const client = await new Client().connect({
  db: DB_NAME,
  hostname: DB_HOST,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  tls: {
    enabled: true,
  },
});

export default client;