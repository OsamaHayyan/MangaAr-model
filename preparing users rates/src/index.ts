import axios from "axios";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

//types
interface ICat {
  _id: string;
  category: string;
  catManga: string[];
}
interface IUser {
  _id: string;
  rate: [{ mangaId: string; rateNum: number; _id: string }];
}

//make delay between requests
function timeout(ms: number) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(null);
    }, ms)
  );
}

//Randomization
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex: number;

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

/*
How the algorithem works:-

1- get all categories & users in random order
2- get random number between 10:50 of Comics with the first category
3- add rate to random user for the choosen Comics between 4 or 5 stars
4- get other random categories between 1 and 5 then get random Comics between 1 and 5 for each category of them
5- add rate to the same user for the choosen Comics between 1 and 3 stars
*/
async function createRandomRates() {
  try {
    //parse categories from its file
    const categories: ICat[] = JSON.parse(
      await fs.promises.readFile(
        path.join(__dirname, "./category.json"),
        "utf-8"
      )
    );

    //get all users from database
    const { data }: { data: IUser[] } = await axios.get(
      "http://localhost:8080/user/users"
    );

    //order users in random way
    const randomUsers = shuffle(data);
    for (let user of randomUsers) {
      try {
        //order
        const AllCat = shuffle(categories);
        const otherCats = AllCat.filter(
          (el, i) => i > 0 && i <= Math.round(Math.random() * (5 - 1) + 1)
        );
        const { _id, category, catManga } = AllCat[0];
        const randomManga = shuffle(catManga).filter(
          (el, i) => i <= Math.round(Math.random() * (50 - 10) + 10)
        );

        for (let mangaId of randomManga) {
          const res = await axios.post(
            `http://localhost:8080/mangas/rate/${mangaId}`,
            {
              rate: Math.round(Math.random() * (5 - 4) + 4).toString(),
              user: user,
            }
          );
        }
        for (let el of otherCats) {
          const randomOtherManga = el.catManga.filter(
            (el, i) => i <= Math.round(Math.random() * (5 - 1) + 1)
          );
          for (let mangaId of randomOtherManga) {
            const res = await axios.post(
              `http://localhost:8080/mangas/rate/${mangaId}`,
              {
                rate: Math.round(Math.random() * (3 - 1) + 1).toString(),
                user: user,
              }
            );
          }
        }
        console.log(user._id);
      } catch (error) {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
}
await createRandomRates();
