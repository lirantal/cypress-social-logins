/* eslint-disable no-undef */
'use strict'

const puppeteer = require('puppeteer')
const authenticator = require('otplib').authenticator
const fs = require('fs')

/**
 *
 * @param {options.username} string username
 * @param {options.password} string password
 * @param {options.loginUrl} string password
 * @param {options.loginUrlCredentials} Object Basic Authentication credentials for the `loginUrl`
 * @param {options.preVisitLoginUrlSetCookies} array[{name: string, value: string, domain: string}] cookies to set before visiting `loginUrl`
 * @param {options.args} array[string] string array which allows providing further arguments to puppeteer
 * @param {options.loginSelector} string a selector on the loginUrl page for the social provider button
 * @param {options.loginSelectorDelay} number delay a specific amount of time before clicking on the login button, defaults to 250ms. Pass a boolean false to avoid completely.
 * @param {options.postLoginSelector} string a selector on the app's post-login return page to assert that login is successful
 * @param {options.preLoginSelector} string a selector to find and click on before clicking on the login button (useful for accepting cookies)
 * @param {options.preLoginSelectorIframe} string a selector to find a iframe for the preLoginSelector
 * @param {options.preLoginSelectorIframeDelay} number delay a specific milliseconds after click on the preLoginSelector. Pass a falsy (false, 0, null, undefined, '') to avoid completely.
 * @param {options.otpSecret} string Secret for generating a otp based on OTPLIB
 * @param {options.headless} boolean launch puppeteer in headless more or not
 * @param {options.logs} boolean whether to log cookies and other metadata to console
 * @param {options.getAllBrowserCookies} boolean whether to get all browser cookies instead of just for the loginUrl
 * @param {options.isPopup} boolean is your google auth displayed like a popup
 * @param {options.popupDelay} number delay a specific milliseconds before popup is shown. Pass a falsy (false, 0, null, undefined, '') to avoid completely
 * @param {options.cookieDelay} number delay a specific milliseconds before get a cookies. Pass a falsy (false, 0, null, undefined, '') to avoid completely.
 * @param {options.postLoginClick} string a selector to find and click on after clicking on the login button
 * @param {options.usernameField} string selector for the username field
 * @param {options.usernameSubmitBtn} string selector for the username button
 * @param {options.passwordField} string selector for the password field
 * @param {options.passwordSubmitBtn} string selector password submit button
 * @param {options.additionalSteps} function any additional func which may be required for signin step after username and password
 * @param {options.screenshotOnError} boolean grab a screenshot if an error occurs during username, password, or post-login page
 * @param {options.trackingConsentSelectors} array[string] selectors to find and click on before entering details on the third-party site (useful for accepting third-party cookies)
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

function takeScreenshot(page, options) {
  if (options.screenshotOnError) {
    if (!fs.existsSync('./cypress/screenshots/cypresssociallogin/')) {
      fs.mkdirSync('./cypress/screenshots/cypresssociallogin/', {recursive: true})
    }
    page.screenshot({path: './cypress/screenshots/cypresssociallogin/SocialLoginError.png'})
  }
}

async function login({page, options} = {}) {
  if (options.preLoginSelector && !options.preLoginSelectorIframe) {
    await page.waitForSelector(options.preLoginSelector)
    await page.click(options.preLoginSelector)
  } else if (options.preLoginSelector && options.preLoginSelectorIframe) {
    await page.waitForSelector(options.preLoginSelectorIframe)
    const elementHandle = await page.$(options.preLoginSelectorIframe)
    const frame = await elementHandle.contentFrame()
    await frame.waitForSelector(options.preLoginSelector)
    await frame.click(options.preLoginSelector)
    if (options.preLoginSelectorIframeDelay !== false) {
      await delay(options.preLoginSelectorIframeDelay)
    }
  }

  if (options.loginSelector) {
    await page.waitForSelector(options.loginSelector)

    if (options.loginSelectorDelay !== false) {
      await delay(options.loginSelectorDelay)
    }

    await page.click(options.loginSelector)
  }
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

async function baseLoginConnect(
  typeUsername,
  typePassword,
  otpApp,
  authorizeApp,
  postLogin,
  options
) {
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
  if (options.loginUrlCredentials) {
    await page.authenticate(options.loginUrlCredentials)
  }

  if (options.preVisitLoginUrlSetCookies && options.preVisitLoginUrlSetCookies.length > 0) {
    await page.setCookie(...options.preVisitLoginUrlSetCookies)
  }

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

  // Accept third-party cookies if required
  if (options.trackingConsentSelectors !== undefined) {
    for (const selector of options.trackingConsentSelectors) {
      await page.waitForSelector(selector)
      await page.click(selector)
    }
  }

  await typeUsername({page, options})
  await typePassword({page, options})

  if (typeof options.additionalSteps !== 'undefined') {
    await options.additionalSteps({page, options})
  }

  if (options.otpSecret && otpApp) {
    await otpApp({page, options})
  }

  if (options.authorize) {
    await authorizeApp({page, options})
  }

  // Switch back to Original Window
  if (options.isPopup) {
    if (options.popupDelay) {
      await delay(options.popupDelay)
    }
    const pages = await browser.pages()
    page = pages[originalPageIndex]
  }

  if (options.postLoginClick) {
    await postLogin({page, options})
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

module.exports.baseLoginConnect = baseLoginConnect

module.exports.GoogleSocialLogin = async function GoogleSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    try {
      await page.waitForSelector('input#identifierId[type="email"]')
      await page.type('input#identifierId[type="email"]', options.username)
      await page.click('#identifierNext')
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const typePassword = async function({page, options} = {}) {
    try {
      let buttonSelectors = ['#signIn', '#passwordNext', '#submit']

      await page.waitForSelector('input[type="password"]', {visible: true})
      await page.type('input[type="password"]', options.password)

      const buttonSelector = await waitForMultipleSelectors(buttonSelectors, {visible: true}, page)
      await page.click(buttonSelector)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const postLogin = async function({page, options} = {}) {
    try {
      await page.waitForSelector(options.postLoginClick)
      await page.click(options.postLoginClick)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  return baseLoginConnect(typeUsername, typePassword, null, null, postLogin, options)
}

module.exports.GitHubSocialLogin = async function GitHubSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    try {
      await page.waitForSelector('input#login_field')
      await page.type('input#login_field', options.username)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const typePassword = async function({page, options} = {}) {
    try {
      await page.waitForSelector('input#password', {visible: true})
      await page.type('input#password', options.password)
      await page.click('input[type="submit"]')
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const authorizeApp = async function({page, options} = {}) {
    await page.waitForSelector('button#js-oauth-authorize-btn', {visible: true})
    await page.click('button#js-oauth-authorize-btn', options.password)
  }

  const postLogin = async function({page, options} = {}) {
    try {
      await page.waitForSelector(options.postLoginClick)
      await page.click(options.postLoginClick)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  return baseLoginConnect(typeUsername, typePassword, null, authorizeApp, postLogin, options)
}

module.exports.MicrosoftSocialLogin = async function MicrosoftSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    try {
      await page.waitForSelector('input[type="email"]')
      await page.type('input[type="email"]', options.username)
      await page.click('input[type="submit"]')
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const typePassword = async function({page, options} = {}) {
    try {
      await delay(5000)

      await page.waitForSelector('input[type="password"]', {visible: true})
      await page.type('input[type="password"]', options.password)
      await page.click('input[type="submit"]')
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const authorizeApp = async function({page, options} = {}) {
    await page.waitForSelector('button#js-oauth-authorize-btn', {visible: true})
    await page.click('button#js-oauth-authorize-btn', options.password)
  }

  const postLogin = async function({page, options} = {}) {
    try {
      await page.waitForSelector(options.postLoginClick)
      await page.click(options.postLoginClick)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  return baseLoginConnect(typeUsername, typePassword, null, authorizeApp, postLogin, options)
}

module.exports.AmazonSocialLogin = async function AmazonSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    try {
      await page.waitForSelector('#ap_email', {visible: true})
      await page.type('#ap_email', options.username)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const typePassword = async function({page, options} = {}) {
    let buttonSelectors = ['#signInSubmit']

    try {
      await page.waitForSelector('input[type="password"]', {visible: true})
      await page.type('input[type="password"]', options.password)

      const buttonSelector = await waitForMultipleSelectors(buttonSelectors, {visible: true}, page)
      await page.click(buttonSelector)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const otpApp = async function({page, options} = {}) {
    let buttonSelectors = ['#auth-signin-button']

    await page.waitForSelector('#auth-mfa-otpcode', {visible: true})
    await page.type('#auth-mfa-otpcode', authenticator.generate(options.otpSecret))

    const buttonSelector = await waitForMultipleSelectors(buttonSelectors, {visible: true}, page)
    await page.click(buttonSelector)
  }

  return baseLoginConnect(typeUsername, typePassword, otpApp, null, null, options)
}

module.exports.FacebookSocialLogin = async function FacebookSocialLogin(options = {}) {
  const typeUsername = async function({page, options} = {}) {
    try {
      const emailSelector = '#email'
      await page.waitForSelector(emailSelector)
      await page.type(emailSelector, options.username)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  const typePassword = async function({page, options} = {}) {
    try {
      await page.waitForSelector('input[type="password"]', {visible: true})
      await page.type('input[type="password"]', options.password)

      // Submit first form
      await page.click('#loginbutton')
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }

    try {
      // Submit next form
      const confirmBtnSelector = 'button[name="__CONFIRM__"]'
      await page.waitForSelector(confirmBtnSelector)
      await page.click(confirmBtnSelector)
    } catch (e) {
      // Isn't always presented by Facebook
    }
  }

  const postLogin = async function({page, options} = {}) {
    try {
      await page.waitForSelector(options.postLoginClick)
      await page.click(options.postLoginClick)
    } catch (err) {
      takeScreenshot(page, options)
      throw err
    }
  }

  return baseLoginConnect(typeUsername, typePassword, null, null, postLogin, options)
}

module.exports.CustomizedLogin = async function CustomizedLogin(options = {}) {
  if (options.usernameField && options.passwordField) {
    const typeUsername = async function({page, options} = {}) {
      try {
        await page.waitForSelector(options.usernameField, {visible: true})
        await page.type(options.usernameField, options.username)
        if (options.usernameSubmitBtn) {
          await page.click(options.usernameSubmitBtn)
        }
      } catch (err) {
        takeScreenshot(page, options)
        throw err
      }
    }
    const typePassword = async function({page, options} = {}) {
      try {
        await page.waitForSelector(options.passwordField, {visible: true})
        await page.type(options.passwordField, options.password)
        if (options.passwordSubmitBtn) {
          await page.click(options.passwordSubmitBtn)
        }
      } catch (err) {
        takeScreenshot(page, options)
        throw err
      }
    }
    const postLogin = async function({page, options} = {}) {
      try {
        await page.waitForSelector(options.postLoginClick)
        await page.click(options.postLoginClick)
      } catch (err) {
        takeScreenshot(page, options)
        throw err
      }
    }
    return baseLoginConnect(typeUsername, typePassword, null, null, postLogin, options)
  } else {
    throw new Error(
      'Please review your option properties. Propeties usernameField and passwordField are required as type String.'
    )
  }
}
