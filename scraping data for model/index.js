import fs, { readFile, readFileSync, writeFileSync } from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import url from "url";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Add a response interceptor
let pageNum;
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data

    if (url.parse(response.config.url).pathname == "/manga_list")
      console.log(`page ${pageNum} downloaded`);
    return response;
  },
  async function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    const response = await axios.get(error.config.url);
    return response;
  }
);

// index.js
function timeout(ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
}

async function performScraping() {
  try {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    for (let i = 1; i <= 1444; i++) {
      pageNum = i;
      const axiosResponse = await axios.request({
        method: "GET",
        url: `https://mangakakalot.com/manga_list?type=topview&category=all&state=all&page=${i}`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
      });
      // parsing the HTML source of the target web page with Cheerio
      const $ = cheerio.load(axiosResponse.data);
      // initializing the data structures
      // that will contain the scraped data
      // scraping the "Learn how web data is used in your market" section
      $(".list-truyen-item-wrap").each(async (index, element) => {
        // extracting the data of interest
        let pageUrl = $(element).find("h3 > a").attr("href");
        const pateTitle = $(element).find("h3 > a").text().trim();
        let data = readFileSync("./data.json");
        data = data.length > 0 ? data : "[]";
        const info = JSON.parse(data);
        const checkExist = info.some((el) => {
          el.title.toLowerCase() == pateTitle.toLowerCase();
        });
        if (checkExist) return;
        let title, story, status;
        let categories = [],
          author = [];
        let imagePath;
        let writer;
        if (url.parse(pageUrl).host == "readmanganato.com") {
          pageUrl = new URL(
            url.parse(pageUrl).pathname,
            "https://chapmanganato.com"
          ).toString();
        }
        axios
          .get(pageUrl)
          .then(async (respose) => {
            const $$ = cheerio.load(respose.data);
            if (url.parse(pageUrl).host == "chapmanganato.com") {
              title = $$(".story-info-right > h1").text().trim();
              $$(".manga-info-text > h1").text().trim();
              story = $$(".panel-story-info-description")
                ? $$(".panel-story-info-description")
                    .contents()
                    .not("h3,br")
                    .text()
                    .trim()
                : $$("#noidungm").contents().not("h2,br").text().trim();
              $$(".variations-tableInfo")
                .find("tr")
                .each((i, el) => {
                  if ($$(el).find(".table-label > .info-author").length > 0) {
                    $$(el)
                      .find(".table-value > a")
                      .each((i, child) => author.push($$(child).text().trim()));
                    return;
                  } else if (
                    $$(el).find(".table-label > .info-status").length > 0
                  ) {
                    status = $$(el).children(".table-value").text().trim();
                    return;
                  } else if (
                    $$(el).find(".table-label > .info-genres").length > 0
                  ) {
                    $$(el).find(".table-label > .info-genres").length > 0;
                    $$(el)
                      .find(".table-value > a")
                      .each((index, cat) => {
                        categories.push($$(cat).text().trim());
                      });
                    return;
                  }
                });
              let imageUrl = $$(".info-image > img").attr("src");
              const imageName = path.basename(url.parse(imageUrl).pathname);
              if (!fs.existsSync(`./images/${imageName}`)) {
                let imageData = await axios.get(imageUrl, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                  },
                  responseType: "stream",
                });
                writer = fs.createWriteStream(path.join("./images", imageName));
                imageData.data.pipe(writer);

                // converting the data extracted into a more
                // readable object
                writer.once("finish", () => {
                  imagePath = path.join(__dirname, "images", imageName);
                  const manga = {
                    title: title,
                    status: status,
                    author: author,
                    categories: categories,
                    story: story,
                    image: imagePath,
                  };

                  // trasforming the scraped data into a general object
                  // converting the scraped data object to JSON
                  let result = readFileSync("./data.json");
                  result = result.length <= 0 ? "[]" : result;
                  let data = JSON.parse(result);
                  data.push(manga);
                  const scrapedDataJSON = JSON.stringify(data, null, 2);
                  writeFileSync("./data.json", scrapedDataJSON);
                  // storing scrapedDataJSON in a database via an API call...
                });
              } else {
                imagePath = path.join(__dirname, "images", imageName);
                const manga = {
                  title: title,
                  status: status,
                  author: author,
                  categories: categories,
                  story: story,
                  image: imagePath,
                };

                // trasforming the scraped data into a general object
                // converting the scraped data object to JSON
                let result = readFileSync("./data.json");
                result = result.length <= 0 ? "[]" : result;
                let data = JSON.parse(result);
                data.push(manga);
                const scrapedDataJSON = JSON.stringify(data, null, 2);
                writeFileSync("./data.json", scrapedDataJSON);
                // storing scrapedDataJSON in a database via an API call...
              }
            } else if (url.parse(pageUrl).host == "mangakakalot.com") {
              title = $$(".manga-info-text > li > h1").text().trim();
              story = $$("#noidungm").contents().not("h2,br").text().trim();
              $$(".manga-info-text")
                .find("li:eq(1) > a")
                .each((i, el) => author.push($$(el).text().trim()));
              $$(".manga-info-text")
                .find("li:eq(6) > a")
                .each((i, el) => categories.push($$(el).text().trim()));
              status = $$(".manga-info-text")
                .find("li:eq(2)")
                .text()
                .trim()
                .split(" : ")[1];
              let imageUrl = $$(".manga-info-pic > img").attr("src");
              const imageName = path.basename(url.parse(imageUrl).pathname);

              if (!fs.existsSync(`./images/${imageName}`)) {
                let imageData = await axios.get(imageUrl, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                  },
                  responseType: "stream",
                });
                writer = fs.createWriteStream(path.join("./images", imageName));
                imageData.data.pipe(writer);

                // converting the data extracted into a more
                // readable object
                writer.once("finish", () => {
                  imagePath = path.join(__dirname, "images", imageName);
                  const manga = {
                    title: title,
                    status: status,
                    author: author,
                    categories: categories,
                    story: story,
                    image: imagePath,
                  };
                  // adding the object containing the scraped data
                  // to the industries array
                  // trasforming the scraped data into a general object
                  // converting the scraped data object to JSON
                  let result = readFileSync("./data.json");
                  result = result.length <= 0 ? "[]" : result;
                  let data = JSON.parse(result);
                  data.push(manga);
                  const scrapedDataJSON = JSON.stringify(data, null, 2);
                  writeFileSync("./data.json", scrapedDataJSON);
                  // storing scrapedDataJSON in a database via an API call...
                });
              } else {
                imagePath = path.join(__dirname, "images", imageName);
                const manga = {
                  title: title,
                  status: status,
                  author: author,
                  categories: categories,
                  story: story,
                  image: imagePath,
                };
                // adding the object containing the scraped data
                // to the industries array
                // trasforming the scraped data into a general object
                // converting the scraped data object to JSON
                let result = readFileSync("./data.json");
                result = result.length <= 0 ? "[]" : result;
                let data = JSON.parse(result);
                data.push(manga);
                const scrapedDataJSON = JSON.stringify(data, null, 2);
                writeFileSync("./data.json", scrapedDataJSON);
                // storing scrapedDataJSON in a database via an API call...
              }
            }

            console.log(`manga number ${index}`);
          })
          .catch(console.error);
      });
      await timeout(1000);
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("respose Error happend");
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log("request Error happend");
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("another Error happend");
      console.log("Error", error.message);
    }
    // console.log(error.config);
  }
}

performScraping();
