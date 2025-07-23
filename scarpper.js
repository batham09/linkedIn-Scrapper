import fs from 'fs';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';


const OPENAI_API_KEY =
  "YOUR_GPT_KEY";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const gptModel = "gpt-4.1-2025-04-14"; //gpt-4o	


const getCompanyName =  ( async (userData)=>{

    try {
        const response = await axios.post(
          OPENAI_URL,
          {
            model: gptModel,
            messages: [
              {
                role: "system",
                content: `You are an AI Agent that predicts the company name using the data been provided to you`,
              },
              {
                role: "user",
                content: `You are an **intelligent data analyst** specializing in professional profile analysis. Your job is to **predict the current or most likely employer (company name)** for a person based on available LinkedIn-style profile data.
              
              ---
              
              ### Task
              Given user profile data including name, bio (headline), and location, your task is to extract or predict the **most likely company name** the user is associated with.
              
              ---
              
              ### Input Format
              You will receive a JSON object with the following structure:
              
              \`\`\`json
              {
                "name": "Full Name",
                "bio": "LinkedIn headline or professional summary",
                "location": "Location (city or region)"
              }
              \`\`\`
              
              ---
              
              ### Output Format
              Return a **single string** — the most likely company name (e.g., "Microsoft", "TCS", "Infosys"). If you're not confident or the company isn't clearly mentioned, respond with:
              
              \`\`\`
              "Unknown"
              \`\`\`
              
              ---
              
              ### Evaluation Strategy
              - If a company is clearly mentioned in the **bio**, use it.
              - If multiple companies are mentioned, choose the one the user is **currently working at** (look for present-tense roles like “at XYZ” or “currently at XYZ”).
              - Do **not** guess based on past experience unless it's the only data available.
              - Do **not** fabricate company names.
              - Capitalize the company name properly.
              
              ---
              
              ### Examples
              
              #### Example Input 1:
              \`\`\`json
              {
                "name": "Dhiraj Mane (L.I.O.N.)",
                "bio": "Talent Acquisition Leader at Infostretch/Apexon - A Goldman Sachs and Everstone Company",
                "location": "Pune"
              }
              \`\`\`
              
              #### Output:
              \`\`\`
              "Apexon"
              \`\`\`
              
              #### Example Input 2:
              \`\`\`json
              {
                "name": "Riya Sharma",
                "bio": "HR Specialist | Ex-Infosys, Wipro",
                "location": "Bangalore"
              }
              \`\`\`
              
              #### Output:
              \`\`\`
              "Unknown"
              \`\`\`
              
              ---
              
              Now analyze the following input and return the company name accordingly:
              
              ### User Data:
              ${JSON.stringify(userData, null, 2)}
              `
              }
              
            ],
            temperature: 0.7,
            max_tokens: 200,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );
    
        const summary = response.data.choices[0].message.content
          .trim()
          .replace(/^"|"$/g, "");
    
        return summary
      } catch (error) {
        console.error(
          "Error fetching response from OpenAI:",
          error.response ? error.response.data : error.message,
        );
        return null;
      }
    
})



puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });


  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  await page.goto("https://www.linkedin.com/login", { waitUntil: "networkidle2" });


  console.log("⚠️ Login required. Please log in manually...");

  console.log("⚠️ Page navigation detected");

  await page.waitForFunction(
    () => window.location.href.includes("/feed")
  );
  
  console.log("✅ Feed page loaded. Login successful!");
  

  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  

  await page.waitForSelector('.global-nav__search input[placeholder="Search"]');
  

  const searchInput = await page.$('.global-nav__search input[placeholder="Search"]');
  await searchInput.click();
  await searchInput.type('recruiters', { delay: 100 });
  await page.keyboard.press('Enter');

  console.log("🔍 Search results loaded.");
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

await page.waitForSelector('button.search-reusables__filter-pill-button', { timeout: 20000 });
const buttons = await page.$$('button.search-reusables__filter-pill-button');
for (const btn of buttons) {
  const text = await (await btn.getProperty('innerText')).jsonValue();
  if (text.trim() === 'People') {
    await btn.click();
    console.log("✅ Clicked on 'People' tab");
    break;
  }
}

await page.waitForSelector('button.search-reusables__filter-pill-button', { timeout: 20000 });
const filterButtons = await page.$$('button.search-reusables__filter-pill-button');
let foundLocation = false;
for (const btn of filterButtons) {
  const text = await (await btn.getProperty('innerText')).jsonValue();
  if (text.trim() === 'Locations') {
    await btn.click();
    foundLocation = true;
    console.log("✅ Clicked on 'Locations' filter");
    break;
  }
}
if (!foundLocation) throw new Error("❌ 'Locations' filter not found!");


await page.waitForSelector('div.search-basic-typeahead.search-vertical-typeahead input.basic-input', { timeout: 10000 });
await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

const locationInput = await page.$('div.search-basic-typeahead.search-vertical-typeahead input.basic-input');
await locationInput.type('Pune', { delay: 100 });
await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for dropdown


await locationInput.press('ArrowDown');
await locationInput.press('Enter');
console.log("✅ Selected first location suggestion");


await new Promise(resolve => setTimeout(resolve, 1000));


await page.waitForSelector('button.artdeco-button--primary.ml2', { timeout: 10000 });
const showResultsBtn = await page.$('button.artdeco-button--primary.ml2');
if (showResultsBtn) {
  await showResultsBtn.click();
  console.log("✅ Clicked 'Show results' button");
} else {
  throw new Error("❌ 'Show results' button not found!");
}

await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  const htmlPages = [];

  for (let i = 0; i < 3; i++) {
    console.log(`🔄 Fetching HTML for page ${i + 1}...`);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    const html = await page.content();
    htmlPages.push(html);
console.log("came here")
    const nextBtn = await page.$('button.artdeco-pagination__button--next');
    if (nextBtn) {
      await nextBtn.click();
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    } else {
      console.log("⛔ No more pages.");
      break;
    }
  }
  await browser.close();
  console.log("✅ Collected HTML for all pages.");

  const allResults = [];
  for (const html of htmlPages) {
    const $ = cheerio.load(html);
    $('.pv0.ph0.mb2.artdeco-card').each((i, card) => {
      $(card).find('li').each((j, li) => {
        const name = $(li).find('.t-roman.t-sans a').first().text().trim();
        const bio = $(li).find('.t-14.t-black.t-normal').first().text().trim();
        let location = '';
        $(li).find('.t-14.t-normal').each((k, locElem) => {
          if (!$(locElem).hasClass('t-black')) {
            location = $(locElem).text().trim();
          }
        });

        if (name) {
          allResults.push({ name, bio, location });
        }
      });
    });
  }
  console.log(allResults);

   const resultsWithCompany = await Promise.all(
  allResults.map(async (userInfo) => {
    const companyName = await getCompanyName(userInfo);
    return { ...userInfo, companyName };
  })
);
 
// Write results to a JSON file
fs.writeFileSync('linkedin_Scrapped_Data.json', JSON.stringify(resultsWithCompany, null, 2), 'utf-8');
console.log('✅ Data saved to linkedin_results.json');
})();






