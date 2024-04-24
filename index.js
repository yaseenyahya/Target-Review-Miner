require("dotenv").config({ path: ".env" });
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { ApolloServer, gql } = require("apollo-server-express");
const { sameSiteCookieMiddleware } = require("express-samesite-default");
const cors = require("cors");
const http = require("http");
const path = require("path");

const axios = require('axios');
const { JSDOM } = require('jsdom');
const _ = require('lodash');
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 4000;

app.enable("trust proxy");
app.use(sameSiteCookieMiddleware());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.disable("x-powered-by");

const corsOptions = {
  origin: true,
  credentials: true,
  enablePreflight: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Methods",
    "Access-Control-Request-Headers",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.options("*/*", cors(corsOptions));




async function getVisitorId() {
  var apiKey = '';
  var visitorId = '';
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
      // Make a request to the target.com URL
      const response = await axios.get('https://www.target.com',{ headers });

      // Access the Set-Cookie header from the response
      const setCookieHeader = response.headers['set-cookie'];

  
      // Ensure setCookieHeader is a string
      const setCookieString = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;

      // Extract the visitorId from the Set-Cookie header
       visitorId = extractVisitorId(setCookieString);

    

    
      const dom = new JSDOM(response.data);

      const scripts = dom.window.document.querySelectorAll('script');

      // Extract JavaScript content starting with Object.defineProperties
      scripts.forEach(script => {
        const scriptContent = script.textContent;
  
        if (scriptContent.includes('Object.defineProperties')) {
          const domAlternate = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { runScripts: 'dangerously' });

          domAlternate.window.eval(scriptContent);
          const configValue =  domAlternate.window['__CONFIG__'];
          apiKey = configValue.services.apiPlatform.apiKey;
        }
      });


      // Replace with your actual API key
const keyword = '062-16-2339'; // Replace with your actual keyword

const url = `https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?key=${apiKey}&channel=WEB&count=24&default_purchasability_filter=false&include_sponsored=true&keyword=${keyword}&new_search=true&offset=0&page=%2Fs%2F${keyword}&platform=desktop&pricing_store_id=1771&scheduled_delivery_store_id=1771&useragent=Mozilla%2F5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F120.0.0.0+Safari%2F537.36&visitor_id=${visitorId}&zip=52404`;

const responseProducts = await axios.get(url,{ headers });

var productData = _.filter(responseProducts.data.data.search.products,product => product.item.dpci.replace(/\D/g, '') == keyword.replace(/\D/g, ''));


for (const product of productData) {
  const originalTcin = product.original_tcin;
  const parentTcin = product.parent.tcin;
 // console.log("product.item",product.item);
  console.log("originalTcin",originalTcin);
 console.log("product.item.parent.tcin",product.parent.tcin);
  //for (let page = 0; page < totalPages; page++) {
    //await getReviews(page);
  //}
  console.log("fetching data of page:",1)
  const reviewUrl = `https://r2d2.target.com/ggc/v2/summary?key=${apiKey}&hasOnlyPhotos=false&includes=reviews&page=0&entity=&reviewedId=${parentTcin}&reviewType=PRODUCT&size=50&sortBy=most_recent&verifiedOnly=false`;
console.log(reviewUrl)
  //78829931 it is variation
  try {
    const responseReview = await axios.get(reviewUrl, {headers });

    
  //  console.log("reviews_total_results",responseReview.data.reviews.total_results);

   var reviewDataAll = transformReviewArrayForExcel(responseReview.data.reviews.results,product.item.product_description.title,product.item.dpci);
  
  const totalResults = responseReview.data.reviews.total_results;
  const totalPages = responseReview.data.reviews.total_pages;
  console.log("totalPages",totalPages)
  for (let page = 1; page < 50 && page < totalPages ; page++) {
    await randomWait();
    const reviewUrlOtherPage = `https://r2d2.target.com/ggc/v2/summary?key=${apiKey}&hasOnlyPhotos=false&includes=reviews&page=${page}&entity=&reviewedId=${parentTcin}&reviewType=PRODUCT&size=50&sortBy=most_recent&verifiedOnly=false`;
    //78829931 it is variation
    console.log("fetching data of page:",page + 1)
      try {
        const responseReviewOtherPage = await axios.get(reviewUrlOtherPage, {headers });
        var reviewDataOtherPages =  transformReviewArrayForExcel(responseReviewOtherPage.data.reviews.results,product.item.product_description.title,product.item.dpci);
     
        reviewDataAll.push(...reviewDataOtherPages);
      
      }catch(error){
        console.error('Error fetching review page '+page+':', error.message);
      }
  }
  
  
   const currentDirectory = process.cwd(); // Get the current working directory
   const fileName = 'exported_data.xlsx';
   const filePath = path.join(currentDirectory, fileName);
   exportToExcel(reviewDataAll, filePath)

  } catch (error) {
    console.error('Error fetching review page 1:', error.message);
  }
}

  } catch (error) {
      console.error('Error fetching target:', error.message);
  }
}
async function randomWait() {
  // Generate a random delay between 5 seconds and 2 minutes (in milliseconds)
  //const delay = Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000;
 // console.log(`Waited for ${delay / 1000} seconds.`);
  // Wait for the random delay
  await new Promise((resolve) => setTimeout(resolve, 5000));

 
}
async function exportToExcel(data, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');

  // Define headers
  const headers = [
    'Date/Time',
    'Comment',
    'Product Name',
    'Rating',
    'DPCI/Item Code',
    'Verified Purchaser',
    'Positive Comment',
    'TCIN',
  ];

  // Add headers to the worksheet
  worksheet.addRow(headers);

  // Add data to the worksheet
  data.forEach((row) => {
    worksheet.addRow(Object.values(row));
  });

  // Save the workbook to a file
  await workbook.xlsx.writeFile(filePath);
}
function transformReviewArray(inputArray) {
  return inputArray.map((review) => {
    const {
      id: review_id,
      author: { external_id: author_external_id, nickname: author_nickname },
      title,
      text,
      submitted_at,
      modified_at,
      Tcin: tcin,
      badges,
      is_verified,
    } = review;

    const badgesVerifiedUser =
      is_verified && badges && badges.includes("verifiedPurchaser");

    return {
      review_id,
      author_external_id,
      author_nickname,
      title,
      text,
      submitted_at,
      modified_at,
      tcin,
      badgesVerifiedUser,
    };
  });
}
function transformReviewArrayForExcel(inputArray,product_name,dpci) {
  return inputArray.map((review) => {
    const {
      id: review_id,
      author: { external_id: author_external_id, nickname: author_nickname },
      title,
      text,
      submitted_at,
      Rating:rating,
      modified_at,
      Tcin: tcin,
      Badges:badges,
      is_verified,
      is_recommended
    } = review;

    const verified_purchaser =
      badges && badges.verifiedPurchaser ? true: false;

    return {
      submitted_at : moment(submitted_at).tz('America/New_York').format('MM/DD/YYYY h:mm A'),
      comment: title + "\n" + text,
      product_name,
      rating,
      dpci,
      verified_purchaser,
      is_recommended,
      tcin
    };
  });
}
// Function to extract visitorId from Set-Cookie header
function extractVisitorId(setCookieHeader) {
  if (!setCookieHeader) {
      return null;
  }

  const visitorIdRegex = /visitorId=([^;]+)/;
  const match = setCookieHeader.match(visitorIdRegex);

  return match ? match[1] : null;
}


getVisitorId();