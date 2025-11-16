const fs = require("fs");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const FormData = require("form-data");
require("dotenv").config();

async function analyzeImage(imagePath) {
  const formData = new FormData();
  formData.append("media", fs.createReadStream(imagePath));
  formData.append("models", "image,ai_generated,image_similarity");

  const response = await fetch("https://api.thehive.ai/api/v2/task/sync", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.HIVE_API_KEY}`
    },
    body: formData
  });

  const result = await response.json();
  return result;
}

module.exports = analyzeImage;
