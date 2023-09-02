import puppeteer from 'puppeteer';

let categorySelector = '.home-category-list__category-grid';
let brandSelector = '.ofs-carousel__shop-cover-image';
let baseUrlForLinks = 'https://shopee.vn';

let browser = null;
let baseUrlsPage = null;

let SLEEP_AFTER_PAGE_PARSING = 10000; // 10 senconds
let SLEEP_BEFORE_NEXT_SOURCING = 60000 * 2; // 2 min

async function sleep(time){
  return new Promise(resolve => setTimeout(resolve, time))
}

function getBrowserSettins() {
  const browserSettings = {
      headless: false,
      defaultViewport: null
  };
  return browserSettings;
}

async function initChrome(){
  const browserSettings = getBrowserSettins();
  browser = await puppeteer.launch(browserSettings);
  const page = await browser.newPage();

  return page;
}

async function blockJS(page){
  await page.setRequestInterception(true);
  page.on('request', request => {
      if (request.resourceType() === 'script')
        request.abort();
      else
        request.continue();
  });
}


async function getCategoryLinkList(){
  baseUrlsPage = browser ? await browser.newPage() : await initChrome();
  await blockJS(baseUrlsPage);

  const response = await baseUrlsPage.goto(`${baseUrlForLinks}/`, { waitUntil: 'networkidle2' });
  if(response.status() === 403){
      SLEEP_BEFORE_NEXT_SOURCING *= 2;
      console.log(`Status Code = 403. SLEEP_BEFORE_NEXT_SOURCING: ${SLEEP_BEFORE_NEXT_SOURCING/(1000*60)} min`);
      return [];
  }

  const listOfLinks = await baseUrlsPage.$$eval(categorySelector, entries => entries.map(a => a.href));

  return listOfLinks;
}

async function getBrandLinkList(category) {
  const page = await browser.newPage();
  await blockJS(page);

  const response = await page.goto(`${baseUrlForLinks}${category}`, { waitUntil: 'networkidle2' });
  if(response.status() === 403){
      SLEEP_AFTER_PAGE_PARSING *= 2;
      throw new Error(`Status Code = 403. SLEEP_AFTER_EACH_PARSING: ${SLEEP_AFTER_PAGE_PARSING/1000} s`);
  }

  const listOfBrandLink = await page.$$eval(brandSelector, entries => entries.map(a => a.href));

  return listOfBrandLink;
}

async function getDealHot( brandLink ) {
  const page = await browser.newPage();
  await blockJS(page);

  const response = await page.goto(`${baseUrlForLinks}${brandLink}?page=0&sortBy=sales`, { waitUntil: 'networkidle2' });
  if(response.status() === 403){
    SLEEP_AFTER_PAGE_PARSING *= 2;
    throw new Error(`Status Code = 403. SLEEP_AFTER_EACH_PARSING: ${SLEEP_AFTER_PAGE_PARSING/1000} s`);
  }

  
}