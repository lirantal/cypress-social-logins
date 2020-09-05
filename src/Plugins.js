/* eslint-disable no-undef */
'use strict'

const puppeteer = require('puppeteer')

/**
 *
 * @param {options.username} string username
 * @param {options.password} string password
 * @param {options.loginUrl} string password
 * @param {options.args} array[string] string array which allows providing further arguments to puppeteer
 * @param {options.loginSelector} string a selector on the loginUrl page for the social provider button
 * @param {options.loginSelectorDelay} number delay a specific amount of time before clicking on the login button, defaults to 250ms. Pass a boolean false to avoid completely.
 * @param {options.postLoginSelector} string a selector on the app's post-login return page to assert that login is successful
 * @param {options.preLoginSelector} string a selector to find and click on before clicking on the login button (useful for accepting cookies)
 * @param {options.headless} boolean launch puppeteer in headless more or not
 * @param {options.logs} boolean whether to log cookies and other metadata to console
 * @param {options.getAllBrowserCookies} boolean whether to get all browser cookies instead of just for the loginUrl
 * @param {options.isPopup} boolean is your google auth displayed like a popup
 * @param {options.popupDelay} number delay a specific milliseconds before popup is shown. Pass a falsy (false, 0, null, undefined, '') to avoid completely
 * @param {options.cookieDelay} number delay a specific milliseconds before get a cookies. Pass a falsy (false, 0, null, undefined, '') to avoid completely.
 *
 */

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time)
  })
}

function validateOptions(options) {
  if (!options.username || !options.password) {
    throw new Error('Username or Password missing for social login')
  }
}

async function login({page, options} = {}) {
  if (options.preLoginSelector) {
    await page.waitForSelector(options.preLoginSelector)
    await page.click(options.preLoginSelector)
  }

  await page.waitForSelector(options.loginSelector)

  if (options.loginSelectorDelay !== false) {
    await delay(options.loginSelectorDelay)
  }

  await page.click(options.loginSelector)
}

async function getCookies({page, options} = {}) {
  await page.waitForSelector(options.postLoginSelector)

  const cookies = options.getAllBrowserCookies
    ? await getCookiesForAllDomains(page)
    : await page.cookies(options.loginUrl)

  if (options.logs) {
    console.log(cookies)
  }

  return cookies
}

async function getLocalStorageData({page, options} = {}) {
  await page.waitForSelector(options.postLoginSelector)

  const localStorageData = await page.evaluate(() => {
    let json = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      json[key] = localStorage.getItem(key)
    }
    return json
  })
  if (options.logs) {
    console.log(localStorageData)
  }

  return localStorageData
}

async function getSessionStorageData({page, options} = {}) {
  await page.waitForSelector(options.postLoginSelector)

  const sessionStorageData = await page.evaluate(() => {
    let json = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      json[key] = sessionStorage.getItem(key)
    }
    return json
  })
  if (options.logs) {
    console.log(sessionStorageData)
  }

  return sessionStorageData
}

async function getCookiesForAllDomains(page) {
  const cookies = await page._client.send('Network.getAllCookies', {})
  return cookies.cookies
}

async function finalizeSession({page, browser, options} = {}) {
  await browser.close()
}

async function waitForMultipleSelectors(selectors, options, page) {
  const navigationOutcome = await racePromises(
    selectors.map(selector => page.waitForSelector(selector, options))
  )
  return selectors[parseInt(navigationOutcome)]
}

async function racePromises(promises) {
  const wrappedPromises = []
  let resolved = false
  promises.map((promise, index) => {
    wrappedPromises.push(
      new Promise(resolve => {
        promise.then(
          () => {
            resolve(index)
          },
          error => {
            if (!resolved) {
              throw error
            }
          }
        )
      })
    )
  })
  return Promise.race(wrappedPromises).then(index => {
    resolved = true
    return index
  })
}

async function baseLoginConnect(typeUsername, typePassword, authorizeApp, options) {
  validateOptions(options)

  const launchOptions = {headless: !!options.headless}

  if (options.args && options.args.length) {
    launchOptions.args = options.args
  }

  const browser = await puppeteer.launch(launchOptions)
  let page = await browser.newPage()
  let originalPageIndex = 1
  await page.setViewport({width: 1280, height: 800})
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-USq=0.9,enq=0.8'
  })
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'
  )

  await page.goto(options.loginUrl)
  await login({page, options})

  // Switch to Popup Window
  if (options.isPopup) {
    if (options.popupDelay) {
      await delay(options.popupDelay)
    }
    const pages = await browser.pages()
    // remember original window index
    originalPageIndex = pages.indexOf(
      pages.find(p => page._target._targetId === p._target._targetId)
    )
    page = pages[pages.length - 1]
  }

  await typeUsername({page, options})
  await typePassword({page, options})

  if (options.authorize) {
    authorizeApp({page, options})
  }

  // Switch back to Original Window
  if (options.isPopup) {
    if (options.popupDelay) {
      await delay(options.popupDelay)
    }
    const pages = await browser.pages()
    page = pages[originalPageIndex]
  }

  if (options.cookieDelay) {
    await delay(options.cookieDelay)
  }

  const cookies = await getCookies({page, options})
  const lsd = await getLocalStorageData({page, options})
  const ssd = await getSessionStorageData({page, options})
  await finalizeSession({page, browser, options})

  return {
    cookies,
    lsd,
    ssd
  }
}

module.exports.GoogleSocialLogin = async function GoogleSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    await page.waitForSelector('input#identifierId[type="email"]')
    await page.type('input#identifierId[type="email"]', options.username)
    await page.click('#identifierNext')
  }

  const typePassword = async function({page, options} = {}) {
    let buttonSelectors = ['#signIn', '#passwordNext', '#submit']

    await page.waitForSelector('input[type="password"]', {visible: true})
    await page.type('input[type="password"]', options.password)

    const buttonSelector = await waitForMultipleSelectors(buttonSelectors, {visible: true}, page)
    await page.click(buttonSelector)
  }

  return baseLoginConnect(typeUsername, typePassword, null, options)
}

module.exports.GitHubSocialLogin = async function GitHubSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    await page.waitForSelector('input#login_field')
    await page.type('input#login_field', options.username)
  }

  const typePassword = async function({page, options} = {}) {
    await page.waitForSelector('input#password', {visible: true})
    await page.type('input#password', options.password)
    await page.click('input[type="submit"]')
  }

  const authorizeApp = async function({page, options} = {}) {
    await page.waitForSelector('button#js-oauth-authorize-btn', {visible: true})
    await page.click('button#js-oauth-authorize-btn', options.password)
  }

  return baseLoginConnect(typeUsername, typePassword, authorizeApp, options)
}

module.exports.MicrosoftSocialLogin = async function MicrosoftSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    await page.waitForSelector('input[type="email"]')
    await page.type('input[type="email"]', options.username)
    await page.click('input[type="submit"]')
  }

  const typePassword = async function({page, options} = {}) {
    await delay(5000)

    await page.waitForSelector('input[type="password"]', {visible: true})
    await page.type('input[type="password"]', options.password)
    await page.click('input[type="submit"]')
  }

  const authorizeApp = async function({page, options} = {}) {
    await page.waitForSelector('button#js-oauth-authorize-btn', {visible: true})
    await page.click('button#js-oauth-authorize-btn', options.password)
  }

  return baseLoginConnect(typeUsername, typePassword, authorizeApp, options)
}
