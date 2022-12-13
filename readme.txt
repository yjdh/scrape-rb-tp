This tool takes in data from [Redbubble.com](https://www.redbubble.com/), one of the largest print on demand sites and stores it into a MySQL database.

This tool can be used in a setup like so:

Scheduled API requests (Integromat for exmaple) -> This API -> MySQL Database (Planetscale was the choice here because every scrape from Redbubble is roughly 10k rows of data, sometimes with duplicate and bad data which needed to be cleaned up) -> Data visualization tool (Tableau public)

It leverages a web scraping service because scraping is very complicated to setup and maintain. There is a lot of work needed involving getting around a website's bot and spam protections.

Goal:

Redbubble is a print on demand site, meaning anyone can make a design and put it on their merchandise. They will market, print and ship it to their customers and pay creators a comission.

Redbubble openly shares their top 10000 searched topics via their sitemap. If you search up any one of those topics, it will tell you how many designs have been created under a topic. Sometimes a highly searched topic on Redbubble does not have many designs, which means that creating a design under that topic can be profitable.

This project enables scheduled data collection to allow for trend analysis between set time periods. This can allow someone to look at what topics are trending or are about to trend and make designs that will get SEO and rank higher before the topic is very popular.

---
# Install:
npm install

# Run:
npm start
