// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
import {
  readJSON,
  writeCSV,
  removeFile,
} from "https://deno.land/x/flat@0.0.13/mod.ts";

type RawData = {
  id: number;
  // deno-lint-ignore camelcase
  token_add: string;
  price: number;
  // deno-lint-ignore camelcase
  for_sale: number;
  // deno-lint-ignore camelcase
  link_img: string;
  name: string;
  escrowAdd: string;
  // deno-lint-ignore camelcase
  seller_address: string;
  attributes: string;
  skin: null;
  type: "saibagang";
  ranking: null;
  lastSoldPrice: null | number;
};

type ParsedData = {
  id: number;
  price: number;
  moonRank?: string;
  solanartURL: string;
  rarityURL: string;
};

// Step 1: Read the downloaded_filename JSON
const filename = Deno.args[0];
const data: Array<RawData> = await readJSON(filename);
const moonrank: Record<string, string> = await readJSON(
  "zzz/moonrank.json"
);

// Step 2: Filter specific data we want to keep and write to a new JSON file
const enhancedData: Array<ParsedData> = data
  .map((item) => {
    const [_, id] = item.name.split("#");
    const solanartURL = `https://solanart.io/search/?token=${item.token_add}`;

    return {
      id: parseInt(id),
      price: item.price,
      moonRank: moonrank[id],
      solanartURL,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.id - b.id);

console.log("Initial Items:", data.length);
console.log("Processed Items:", enhancedData.length);

// Step 3. Write a new JSON file with our filtered data
await writeCSV("data-solanart.csv", enhancedData);
console.log("Wrote data");

const sortedData = enhancedData.sort((a, b) => {
  const aRank = parseInt(a.moonRank || "");
  const bRank = parseInt(b.moonRank || "");

  return aRank - bRank;
});

const buckets = sortedData.reduce<Array<Array<ParsedData>>>(
  (data, item) => {
    let bucket: number | undefined = undefined;
    if (item.price <= 0.5) {
      bucket = 0;
    } else if (item.price <= 1) {
      bucket = 1;
    } else if (item.price <= 1.5) {
      bucket = 2;
    } else if (item.price <= 2) {
      bucket = 3;
    }

    if (bucket !== undefined) {
      data[bucket].push(item);
    }

    return data;
  },
  [[], [], [], []]
);

const topPicks = buckets.reduce((picks, bucket) => {
  const bucketSelection = bucket.slice(0, 3);
  return [...picks, ...bucketSelection];
}, []);

await writeCSV("picks-solanart.csv", topPicks);
console.log("Wrote picks");

await removeFile(filename);
