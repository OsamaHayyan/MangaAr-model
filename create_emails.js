import axios from "axios";
import FormData from "form-data";
import fs, { readFileSync, writeFileSync } from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const data = readFileSync("./data_copy.json");
const info = JSON.parse(data);
let authors = [];
function timeout(ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
}

async function requestSend({
  title,
  story,
  status,
  author,
  categories,
  image,
}) {
  try {
    const data = new FormData();
    data.append("title", title);
    data.append("story", story);
    data.append("status", status);
    author.forEach((auth) => data.append("auther", auth));
    categories.forEach((cat) => data.append("category", cat));
    data.append("image", fs.createReadStream(image));

    const config = {
      method: "post",
      url: "http://localhost:8080/mangas/add",
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };
    let res = await axios(config);
    console.log(res.data.message);
  } catch (error) {
    console.log(error);
  }
}

async function createEmail() {
  try {
    let password = "16870mnh_";
    for (let i = 0; i < 100; i++) {
      let randomNum = Math.floor(10000 + Math.random() * 90000).toFixed();
      let username = randomNum;
      let email = randomNum + "@gmail.com";

      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirm", password);

      await axios.post("http://localhost:8080/user/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
async function createRandomRates() {
  try {
    const users = await axios.get("http://localhost:8080/user/users");
    const randomUsers = shuffle(users.data);
    const categories = await JSON.parse(
      await fs.promises.readFile("./category.json")
    );
    console.log(categories);
    randomUsers.forEach(async (user) => {
      try {
        const randomCategory = shuffle(categories);
      } catch (error) {
        throw error;
      }
    });
  } catch (error) {
    throw error;
  }
}
// await createRandomRates();

// const categories = await axios.get("http://localhost:8080/category/get-cat/");
// writeFileSync("./category.json", JSON.stringify(categories.data, null, 2));
// // writeFileSync("./text.json", JSON.stringify(authors, null, 2));
// // await requestSend(info[0]);
// let x = 0;
// console.log(info.length);
// for (let manga of info) {
//   x++;
//   if (manga.title.length == 0) {
//     // await requestSend(manga);
//     console.log(x);
//   }
// }
// const newInfo = info.filter((el) => {
//   const ext = path.parse(el.image).ext;
//   if (ext == ".jpg" || ext == ".jpeg" || ext == ".png") return false;
//   else return true;
// });
// console.log(newInfo);
// writeFileSync("./data_copy.json", JSON.stringify(info, null, 2));
// const newInfo = info.map((el) => {
//   return {
//     ...el,
//     author: el.author.map((auth) => auth.trim().toLowerCase()),
//     categories: el.categories.map((cat) => cat.trim().toLowerCase()),
//   };
// });
// writeFileSync("./data_copy_copy.json", JSON.stringify(newInfo, null, 2));
// console.log(path.join(__dirname, info[0].image.split("images\\")[1]));
