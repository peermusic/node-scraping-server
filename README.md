# Scraping Server

This server listens to requests for cover art and similarity information and answers with the results of a scrape engine, like the [scrape engine for last.fm](http://github.com/peermusic/scrape-engine).

## Usage

```sh
# Install the dependencies
npm install

# Run the server on localhost:8080
node index.js
```

## Authenticate users

To access the scraping server, users have to authenticate themselves against the server with a URL that looks like this: `peermusic://host:port/#user-id:secret-key`

- **Add a new user:** `node authenticate.js add <Description of the user>`
- **List all currently authenticated users:** `node authenticate.js list`
- **Remove the access of a user:** `node authenticate.js remove <ID of the user>`