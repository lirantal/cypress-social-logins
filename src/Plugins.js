'use strict'

const puppeteer = require('puppeteer')

/**
 *
 * @param {options.username} string username
 * @param {options.password} string password
 * @param {options.loginUrl} string password
 * @param {options.loginSelector} string a selector on the loginUrl page for the social provider button
 * @param {options.postLoginSelector} string a selector on the app's post-login return page to assert that login is successful
 * @param {options.headless} boolean launch puppeteer in headless more or not
 * @param {options.logs} boolean whether to log cookies and other metadata to console
 */
module.exports.GoogleSocialLogin = async function GoogleSocialLogin(options = {}) {
  validateOptions(options)

  const browser = await puppeteer.launch({headless: !!options.headless})
  const page = await browser.newPage()
  await page.setViewport({width: 1280, height: 800})

  await page.goto(options.loginUrl)

  await login({page, options})
  await typeUsername({page, options})
  await typePassword({page, options})

  const cookies = await getCookies({page, options})

  await finalizeSession({page, browser, options})

  return {
    cookies
  }
}

function validateOptions(options) {
  if (!options.username || !options.password) {
    throw new Error('Username or Password missing for social login')
  }
}

async function login({page, options} = {}) {
  await page.waitForSelector(options.loginSelector)
  await page.click(options.loginSelector)
}

async function typeUsername({page, options} = {}) {
  await page.waitForSelector('input[type="email"]')
  await page.type('input[type="email"]', options.username)
  await page.click('#identifierNext')
}

async function typePassword({page, options} = {}) {
  await page.waitForSelector('input[type="password"]', {visible: true})
  await page.type('input[type="password"]', options.password)
  await page.waitForSelector('#passwordNext', {visible: true})
  await page.click('#passwordNext')
}

async function getCookies({page, options} = {}) {
  const cookies = await page.cookies(options.loginUrl)
  if (options.logs) {
    console.log(cookies)
  }

  return cookies
}

async function finalizeSession({page, browser, options} = {}) {
  if (options.postLoginSelector) {
    await page.waitForSelector(options.postLoginSelector)
  }

  await browser.close()
}
