// create the table

CREATE TABLE rankings (
  date DATE DEFAULT (CURRENT_DATE),
  rank INT,
  url VARCHAR(512) collate utf8_bin,
  results INT DEFAULT 0,
  resultsTP INT DEFAULT 0,
  dateAndUrl varchar(512) collate utf8_bin,
  PRIMARY KEY (dateAndUrl)
)

// wipe the table

TRUNCATE TABLE rankings;

// drop the table

DROP TABLE rankings;