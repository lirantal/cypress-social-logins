<p align="center"><h1 align="center">
  cypress-social-logins
</h1>

<p align="center">
  cypress authentication flows using social network providers
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/cypress-social-logins"><img src="https://badgen.net/npm/v/cypress-social-logins" alt="npm version"/></a>
  <a href="https://www.npmjs.org/package/cypress-social-logins"><img src="https://badgen.net/npm/license/cypress-social-logins" alt="license"/></a>
  <a href="https://www.npmjs.org/package/cypress-social-logins"><img src="https://badgen.net/npm/dt/cypress-social-logins" alt="downloads"/></a>
  <a href="https://circleci.com/gh/lirantal/cypress-social-logins"><img src="https://circleci.com/gh/lirantal/cypress-social-logins.svg?style=svg" alt="build"/></a>
  <a href="https://snyk.io/test/github/lirantal/cypress-social-logins"><img src="https://snyk.io/test/github/lirantal/cypress-social-logins/badge.svg" alt="Known Vulnerabilities"/></a>
  <a href="https://github.com/nodejs/security-wg/blob/master/processes/responsible_disclosure_template.md"><img src="https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg" alt="Security Responsible Disclosure" /></a>
</p>

<p align="center">
  ** <strong> ⚠️  DISCLAIMER and LIMITATIONS  ⚠️ </strong> **
</p>

<p align="center">
  <strong>This plugin doesn't work well in a CI environment</strong>, due to the anti-fraud detection mechanisms employed by the likes of Google, GitHub etc. Why? If you attempt to login from a CI machine which has different IPs, geolocation and other fingerprint identification which the account you use isn't normally attempting a login from, then this will trigger Multi Factor Authentication, CAPTCHA, or other means of confirming the identity. When those extra steps are needed, this plugin doesn't work well around them.
</p>

# About

This Cypress library makes it possible to perform third-party logins (think oauth) for services such as GitHub, Google or Facebook.

It does so by delegating the login process to a `puppeteer` flow that performs the login and returns the cookies for the application under test, so they can be set by the calling Cypress flow for the duration of the test.

## Support

Supported identity providers:

| Provider  | Plugin name          |
| --------- | -------------------- |
| Google    | GoogleSocialLogin    |
| GitHub    | GitHubSocialLogin    |
| Microsoft | MicrosoftSocialLogin |
| Amazon    | AmazonSocialLogin    |
| Facebook  | FacebookSocialLogin  |
| Twitter   | TBD                  |
| LinkedIn  | TBD                  |

# Usage

1. Call the declared task with a set of options for the social login flow interaction
2. Set the cookies for the test flow with the help of `Cypress.Cookies.defaults`
3. Copy over all or some (or none) of the local & session storage objects from puppeteer to local instance. _Note:_ If you want to persist localStorage through all tests, see [localStorage Troubleshooting](#localstorage-isnt-persisting-through-all-tests) below.

```js
cy.clearCookies()

return cy.task('GoogleSocialLogin', socialLoginOptions).then(results => {
  results['cookies'].forEach(cookie => {
    if (cookie.domain.includes(cookieName)) {
      cy.setCookie(cookie.name, cookie.value, {
        domain: cookie.domain,
        expiry: cookie.expires,
        httpOnly: cookie.httpOnly,
        path: cookie.path,
        secure: cookie.secure
      })
    }
  })
  cy.window().then(window => {
    Object.keys(results.ssd).forEach(key => window.sessionStorage.setItem(key, results.ssd[key]))
    Object.keys(results.lsd).forEach(key => window.localStorage.setItem(key, results.lsd[key]))
  })
})
```

Options passed to the task include:

| Option name                 | Description                                                                                                                                                                                                                                                                                                                                                           | Example                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| username                    |                                                                                                                                                                                                                                                                                                                                                                       |
| password                    |                                                                                                                                                                                                                                                                                                                                                                       |
| loginUrl                    | The URL for the login page that includes the social network buttons                                                                                                                                                                                                                                                                                                   | https://www.example.com/login                                                                                                     |
| loginUrlCredentials         | Basic Authentication credentials for the `loginUrl`                                                                                                                                                                                                                                                                                                                   | `{username: user, password: demo}`                                                                                                |
| args                        | string array which allows providing further arguments to puppeteer                                                                                                                                                                                                                                                                                                    | `['--no-sandbox', '--disable-setuid-sandbox']`                                                                                    |
| headless                    | Whether to run puppeteer in headless mode or not                                                                                                                                                                                                                                                                                                                      | true                                                                                                                              |
| logs                        | Whether to log interaction with the loginUrl website & cookie data                                                                                                                                                                                                                                                                                                    | false                                                                                                                             |
| loginSelector               | A selector on the page that defines the specific social network to use and can be clicked, such as a button or a link                                                                                                                                                                                                                                                 | `'a[href="/auth/auth0/google-oauth2"]'`                                                                                           |
| postLoginSelector           | A selector on the post-login page that can be asserted upon to confirm a successful login                                                                                                                                                                                                                                                                             | `'.account-panel'`                                                                                                                |
| preLoginSelector            | a selector to find and click on before clicking on the login button (useful for accepting cookies)                                                                                                                                                                                                                                                                    | `'.ind-cbar-right button'`                                                                                                        |
| preLoginSelectorIframe      | string a selector to find a iframe for the preLoginSelector                                                                                                                                                                                                                                                                                                           | `'div#consent iframe'`                                                                                                            |
| preLoginSelectorIframeDelay | number delay a specific ms after click on the preLoginSelector. Pass a falsy (false, 0, null, undefined, '') to avoid completely.                                                                                                                                                                                                                                     | 2000                                                                                                                              |
| otpSecret                   | Secret for generating a one-time password based on OTPLIB                                                                                                                                                                                                                                                                                                             | `'SECRET'`                                                                                                                        |
| loginSelectorDelay          | delay a specific amount of time before clicking on the login button, defaults to 250ms. Pass a boolean false to avoid completely.                                                                                                                                                                                                                                     | `100`                                                                                                                             |
| getAllBrowserCookies        | Whether to get all browser cookies instead of just ones with the domain of loginUrl                                                                                                                                                                                                                                                                                   | true                                                                                                                              |
| isPopup                     | boolean, is your google auth displayed like a popup                                                                                                                                                                                                                                                                                                                   | true                                                                                                                              |
| popupDelay                  | number, delay a specific milliseconds before popup is shown. Pass a falsy (false, 0, null, undefined, '') to avoid completely                                                                                                                                                                                                                                         | 2000                                                                                                                              |
| cookieDelay                 | number, delay a specific milliseconds before get a cookies. Pass a falsy (false, 0, null,undefined,'') to avoid completely                                                                                                                                                                                                                                            | 100                                                                                                                               |
| postLoginClick              | Optional: a selector to find and click on after clicking on the login button                                                                                                                                                                                                                                                                                          | `#idSIButton9`                                                                                                                    |
| usernameField               | Required for CustomizedLogin: string, a selector for the username field                                                                                                                                                                                                                                                                                               |                                                                                                                                   |
| usernameSubmitBtn           | Optional for CustomizedLogin: string, a selector for the username button                                                                                                                                                                                                                                                                                              |                                                                                                                                   |
| passwordField               | Required for CustomizedLogin: string, a selector for the password field                                                                                                                                                                                                                                                                                               |                                                                                                                                   |
| passwordSubmitBtn           | Optional for CustomizedLogin: string, a selector for password submit button                                                                                                                                                                                                                                                                                           |                                                                                                                                   |
| screenshotOnError           | Optional: will grab a screen shot if an error occurs on the username, password, or post-login page and saves in the Cypress screenshots folder.                                                                                                                                                                                                                       | false                                                                                                                             |
| additionalSteps             | Optional: function, to define any additional steps which may be required after executing functions for username and password, such as answering security questions, PIN, or anything which may be required to fill out after username and password process. The function and this property must be defined or referenced from index.js for Cypress Plugins directory. | `async function moreSteps({page, options} = {}) { await page.waitForSelector('#pin_Field') await page.click('#pin_Field') }`      |
| trackingConsentSelectors    | Optional: selectors to find and click on after clicking the login button, but before entering details on the third-party site (useful for accepting third-party cookies e.g. Facebook login). Provide multiple if wanting to accept only essential cookies and it requires multiple clicks                                                                            | `['button[data-testid="cookie-policy-dialog-manage-button"]', 'button-data-testid="cookie-policy-manage-dialog-accept-button"]']` |
| preVisitLoginUrlSetCookies   | Optional: array of cookies to set before visiting the `loginUrl` | `[{name: 'enable-social-login', value: 'true', domain: '.cypress.io'}]` |

## Install

Install the plugin as a dependency

```bash
npm install --save-dev cypress-social-logins
```

## Import the plugin

Import the `cypress-social-logins` plugin definition for the specific social
network login you are interested of, and declare a task that performs the
login.

Example:

```js
const {GoogleSocialLogin} = require('cypress-social-logins').plugins

module.exports = (on, config) => {
  on('task', {
    GoogleSocialLogin: GoogleSocialLogin
  })
}
```

## Using the social login

Once the Cypress task is defined we can expose a test case that makes use of
it. The task will accept an options object with the username, password and
other configurations that need to be specified so that the task can navigate
through the page properly.

Once the task has completed it will return the list of cookies from the new
page. Most likely these cookies need to be set for the rest of the
sessions in the test flow, hence the example code showing the case for
`Cypress.Cookies.defaults`.

```js
describe('Login', () => {
  it('Login through Google', () => {
    const username = Cypress.env('googleSocialLoginUsername')
    const password = Cypress.env('googleSocialLoginPassword')
    const loginUrl = Cypress.env('loginUrl')
    const cookieName = Cypress.env('cookieName')
    const socialLoginOptions = {
      username: username,
      password: password,
      loginUrl: loginUrl,
      headless: true,
      logs: false,
      loginSelector: '[href="/auth/auth0/google-oauth2"]',
      postLoginSelector: '.account-panel'
    }

    return cy.task('GoogleSocialLogin', socialLoginOptions).then(({cookies}) => {
      cy.clearCookies()

      const cookie = cookies.filter(cookie => cookie.name === cookieName).pop()
      if (cookie) {
        cy.setCookie(cookie.name, cookie.value, {
          domain: cookie.domain,
          expiry: cookie.expires,
          httpOnly: cookie.httpOnly,
          path: cookie.path,
          secure: cookie.secure
        })

        Cypress.Cookies.defaults({
          preserve: cookieName
        })
      }
    })
  })
})
```

## Defining custom login

1 Alternative
When you need to use social logins which aren't supported by this plugin you can make use of the `baseLoginConnect()` function that is exported as part of the plugin like so:

```js
const {baseLoginConnect} = require('cypress-social-logins').plugins

module.exports = (on, config) => {
  on('task', {
    customLogin(options) {
      async function typeUsername({page, options} = {}) {
        await page.waitForSelector('input[id="username"]')
        await page.type('input[id="username"]', options.username)
      }

      async function typePassword({page, options} = {}) {
        await page.waitForSelector('input[id="password"]')
        await page.type('input[id="password"]', options.password)
        await page.click('button[id="_submit"]')
      }

      return baseLoginConnect(typeUsername, typePassword, null, options)
    }
  })
}
```

2 Alternative
You can also use the `CustomizedLogin` function and just provide the selectors inside the `options` object to pass into the function. Properties `usernameField` and `passwordField` are required, otherwise the function will throw an Error with a message for requirements. Properties `usernameSubmitBtn` and `passwordSubmitBtn` are optional. (It is recommended to define passwordSubmitBtn to help proceed login flow.)

Test file -

```js
describe('Login', () => {
  it('Login through Google', () => {
    const username = Cypress.env('googleSocialLoginUsername')
    const password = Cypress.env('googleSocialLoginPassword')
    const loginUrl = Cypress.env('loginUrl')
    const cookieName = Cypress.env('cookieName')
    const socialLoginOptions = {
      username,
      password,
      loginUrl,
      usernameField: '#input_username',
      passwordFiedl: '#input_password',
      passwordSubmitBtn: '#login_btn_sign',
      headless: true,
      logs: false,
      loginSelector: '[href="/auth/auth0/google-oauth2"]',
      postLoginSelector: '.account-panel'
    }

    return cy.task('GoogleSocialLogin', socialLoginOptions).then(({cookies}) => {
      cy.clearCookies()

      const cookie = cookies.filter(cookie => cookie.name === cookieName).pop()
      if (cookie) {
        cy.setCookie(cookie.name, cookie.value, {
          domain: cookie.domain,
          expiry: cookie.expires,
          httpOnly: cookie.httpOnly,
          path: cookie.path,
          secure: cookie.secure
        })

        Cypress.Cookies.defaults({
          preserve: cookieName
        })
      }
    })
  })
})
```

Plugns -

```js
/**
 * @type {Cypress.PluginConfig}
 */
const {CustomizedLogin} = require('cypress-social-logins').plugins

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    customizedLogin: options => {
      return CustomizedLogin(options)
    }
  })
}
```

## Using AmazonSocialLogin with OneTimePassword

You need an Amazon account with activated 2fa. The QR-Code is provided by Amazon and contains a SECRET to
calculate an OTP. This is mandatory due the enforcement of 2fa of new amazon-accounts. SMS or E-Mail is not supported.
You can extract the Secret from the QR-Code:

```
otpauth://totp/Amazon%3ASomeUser%40Example?secret=IBU3VLM........&issuer=Amazon
```

You need to set up the account in Amazon with GoogleAuthenticator or any password-manager which supports OTP. Further
information here:
https://www.amazon.com/gp/help/customer/display.html?nodeId=GE6SLZ5J9GCNRW44

## Adding AdditionalSteps to login work flow

If there more steps to your login work-flow after submitting username and pass, you can define your functions for these extra steps, then assign them to the `options.additionalSteps` property in Cypress plugins file.

```js
/**
 * @type {Cypress.PluginConfig}
 */
async function fewMoreSteps({page, options} = {}) {
  // ... define steps
}

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    customizedLogin: options => {
      options.additionalSteps = fewMoreSteps

      return CustomizedLogin(options)
    }
  })
}
```

## Defining custom login

When you need to use social logins which aren't supported by this plugin you can make use of the `baseLoginConnect()` function that is exported as part of the plugin like so:

```js
const {baseLoginConnect} = require('cypress-social-logins').plugins

module.exports = (on, config) => {
  on('task', {
    customLogin(options) {
      async function typeUsername({page, options} = {}) {
        await page.waitForSelector('input[id="username"')
        await page.type('input[id="username"', options.username)
      }

      async function typePassword({page, options} = {}) {
        await page.waitForSelector('input[id="password"]')
        await page.type('input[id="password"]', options.password)
        await page.click('button[id="_submit"]')
      }

      return baseLoginConnect(typeUsername, typePassword, null, options)
    }
  })
}
```

## Using AmazonSocialLogin with OneTimePassword

You need an Amazon account with activated 2fa. The QR-Code is provided by Amazon and contains a SECRET to
calculate an OTP. This is mandatory due the enforcement of 2fa of new amazon-accounts. SMS or E-Mail is not supported.
You can extract the Secret from the QR-Code:

```
otpauth://totp/Amazon%3ASomeUser%40Example?secret=IBU3VLM........&issuer=Amazon
```

You need to set up the account in Amazon with GoogleAuthenticator or any password-manager which supports OTP. Further
information here:
https://www.amazon.com/gp/help/customer/display.html?nodeId=GE6SLZ5J9GCNRW44

# Troubleshooting

## Timeout while trying to enter username

Make sure you are providing the plugin with the username or password in the options when instantiating it. If you're passing it via environment variables then the plugin will look for these two: `CYPRESS_googleSocialLoginUsername` and `CYPRESS_googleSocialLoginPassword`

If your application uses popup auth, make sure you are providing `isPopup: true` configuration parameter.

## Timeout error with Selectors

Puppeteer uses `document.querySelectors`. If you use selectors such as jQuery, you might face timeout errors because Puppeteer may not understand.

You can check these links to get examples for valid selectors:
[document.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
[CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)

## Failed to launch the browser process

If you're getting an error on a Linux server such as:

```
Error: Failed to launch the browser process!
[768:768:0423/165641.025850:ERROR:zygote_host_impl_linux.cc(89)] Running as root without --no-sandbox is not supported. See https://crbug.com/638180.
TROUBLESHOOTING:
```

You should pass the argument `--no-sandbox` to the plugin as extra arguments.

## localStorage isn't persisting through all tests

If you find that `lsd` is not persisting through tests (useful if you need a JWT from SSO in order to login before each test) using the default implementation above, then you can utilize the package `cypress-localstorage-commands` (https://www.npmjs.com/package/cypress-localstorage-commands).

To use:

`npm install --save-dev cypress-localstorage-commands`

```js
import 'cypress-localstorage-commands'

before(() => {
  describe('Login through Google', () => {
    const username = Cypress.env('googleSocialLoginUsername')
    const password = Cypress.env('googleSocialLoginPassword')
    const loginUrl = Cypress.env('loginUrl')
    const localStorageItem = Cypress.env('lsdItemName')
    const socialLoginOptions = {
      username: username,
      password: password,
      loginUrl: loginUrl,
      headless: true,
      logs: false,
      loginSelector: '[href="/auth/auth0/google-oauth2"]',
      postLoginSelector: '.account-panel'
    }

    // Clears localStorage prior to getting any new localStorage items
    cy.clearLocalStorageSnapshot()

    return cy.task('GoogleSocialLogin', socialLoginOptions).then(({lsd}) => {
      // Check for localStorage item, such as a JWT or similar
      const hasLsd = Object.keys(lsd)
        .filter(item => item === localStorageItem)
        .pop()

      if (hasLsd) {
        cy.window().then(() => {
          Object.keys(lsd).forEach(key => {
            cy.setLocalStorage(key, lsd[key])
          })
        })

        // Saves a snapshot of localStorage
        cy.saveLocalStorage()
      }
    })
  })
})

// Restore the saved localStorage snapshot prior to each test
beforeEach(() => {
  cy.restoreLocalStorage()
})

// Save the localStorage snapshot after each test
afterEach(() => {
  cy.saveLocalStorage()
})
```

## Error: module not found: "ws" from file

If you're getting an error message such as:

```
Error: module not found: "ws" from file ..... node_modules/puppeteer/lib/WebSocketTransport.js #17
```

It may be due to the fact that you're requiring one of the exported plugin functions, such as `GoogleSocialLogin` in your spec file in addition to requiring it in `cypress/plugins/index.js`. Remove it from your spec file, or from a `support/index.js` and make sure you export the `GoogleSocialLogin` function as a task only from the `/plugins/index.js` file.

See discussion about [in this issue](https://github.com/lirantal/cypress-social-logins/issues/17).

## Amazon OTP not accepted

Please be aware of proper time on your machine. Make sure you are using ntp to be in sync.

## additionalSteps not a function

Please avoid defining your additionalSteps function inside your test file. It will cause errors when you pass your `options` object through `cy.task()`.

If you also have cases with multiple scenarios, such as having both cases to enter PIN or secuirty after password or enter usual username and password login flow without extra steps, you can add a property in the `options` object as an indicater which additional functions you wish to apply.

Example:

```js
/**
 * @type {Cypress.PluginConfig}
 */
async function fewMoreStepsPin({page, options} = {}) {
  // ... define steps to enter PIN
}

async function fewMoreStepsSecurityQ({page, option} = {}) {
  // ... define steps to enter secuirty question
}

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    customizedLogin: options => {
      if (options.moreSteps === 'pin') {
        // assign options.addtionalSteps pin function
        options.additionalSteps = fewMoreStepsPin
      } else if (options.moreSteps === 'securityQ') {
        // assign options.additionalSteps securityQ
        options.additionalSteps = fewMoreStepsSecurityQ
      }
      return CustomizedLogin(options)
    }
  })
}
```

# Author

Liran Tal <liran.tal@gmail.com>
