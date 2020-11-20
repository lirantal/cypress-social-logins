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

# About

This Cypress library makes it possible to perform third-party logins (think oauth) for services such as GitHub, Google or Facebook.

It does so by delegating the login process to a `puppeteer` flow that performs the login and returns the cookies for the application under test so they can be set by the calling Cypress flow for the duration of the test.

## Support

Supported identity providers:

| Provider  | Plugin name           |
| --------- | --------------------- |
| Google    | GoogleSocialLogin     |
| GitHub    | GitHubSocialLogin     |
| Microsoft | MicrosoftSocialLogin  | 
| Amazon    | AmazonSocialLogin     |
| Facebook  | TBD                   |
| Twitter   | TBD                   |
| LinkedIn  | TBD                   |

# Usage

1. Call the declared task with a set of options for the social login flow interaction
2. Set the cookies for the test flow with the help of `Cypress.Cookies.defaults`
3. Copy over all or some (or none) of the local & session storage objects from puppeteer to local instance. _Note:_ If you want to persist localStorage through all tests, see [localStorage Troubleshooting](#localstorage-isnt-persisting-through-all-tests) below.

```js
cy.clearCookies()

return cy.task('GoogleSocialLogin', socialLoginOptions).then(({cookies, lsd, ssd}) => {
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

  // ssd contains session storage data (window.sessionStorage)
  // lsd contains local storage data (window.localStorage)

  cy.window().then(window => {
    Object.keys(ssd).forEach(key => window.sessionStorage.setItem(key, ssd[key]))
    Object.keys(lsd).forEach(key => window.localStorage.setItem(key, lsd[key]))
  })
})
```

Options passed to the task include:

| Option name                 | Description                                                                                                                       | Example                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| username                    |                                                                                                                                   |
| password                    |                                                                                                                                   |
| loginUrl                    | The URL for the login page that includes the social network buttons                                                               | https://www.example.com/login                  |
| args                        | string array which allows providing further arguments to puppeteer                                                                | `['--no-sandbox', '--disable-setuid-sandbox']` |
| headless                    | Whether to run puppeteer in headless mode or not                                                                                  | true                                           |
| logs                        | Whether to log interaction with the loginUrl website & cookie data                                                                | false                                          |
| loginSelector               | A selector on the page that defines the specific social network to use and can be clicked, such as a button or a link             | `'a[href="/auth/auth0/google-oauth2"]'`        |
| postLoginSelector           | A selector on the post-login page that can be asserted upon to confirm a successful login                                         | `'.account-panel'`                             |
| preLoginSelector            | a selector to find and click on before clicking on the login button (useful for accepting cookies)                                | `'.ind-cbar-right button'`                     |
| preLoginSelectorIframe      | string a selector to find a iframe for the preLoginSelector                                                                       | `'div#consent iframe'`                         |
| preLoginSelectorIframeDelay | number delay a specific ms after click on the preLoginSelector. Pass a falsy (false, 0, null, undefined, '') to avoid completely. | 2000                                           |
| otpSecret                   | Secret for generating a otp based on OTPLIB                                                                                       | `'SECRET'`                                     |
| loginSelectorDelay          | delay a specific amount of time before clicking on the login button, defaults to 250ms. Pass a boolean false to avoid completely. | `100`                                          |
| getAllBrowserCookies        | Whether to get all browser cookies instead of just ones with the domain of loginUrl                                               | true                                           |
| isPopup                     | boolean, is your google auth displayed like a popup                                                                               | true                                           |
| popupDelay                  | number, delay a specific milliseconds before popup is shown. Pass a falsy (false, 0, null, undefined, '') to avoid completely     | 2000                                           |
| cookieDelay                 | number, delay a specific milliseconds before get a cookies. Pass a falsy (false, 0, null,undefined,'') to avoid completely        | 100                                            |
| postLoginClick              | Optional: a selector to find and click on after clicking on the login button                                                                | `#idSIButton9`                                 |

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
page. Most likely that these cookies need to be set for the rest of the
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
      username,
      password,
      loginUrl,
      headless: true,
      logs: false,
      loginSelector: 'a[href="/auth/auth0/google-oauth2"]',
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

When you need to use social logins which aren't supported by this plugin you can make use of the `baseLoginConnect()` function that is exported as part of the plugin like so:

```js
const { baseLoginConnect } = require('cypress-social-logins').plugins

module.exports = (on, config) => {
    on('task', {
        customLogin(options) {
            async function typeUsername({ page, options } = {
            }) {
                await page.waitForSelector('input[id="username"')
                await page.type('input[id="username"', options.username)
            }

            async function typePassword({ page, options } = {
            }) {
                await page.waitForSelector('input[id="password"]')
                await page.type('input[id="password"]', options.password)
                await page.click('button[id="_submit"]')
            }

            return baseLoginConnect(typeUsername, typePassword, null, options);
        }
    })
}
```

## Using AmazonSocialLogin with OneTimePassword

You need a amazon account with activated 2fa. The QR-Code is provided by amazon and contains a SECRET to
calculate a OTP. This is mandatory due the enforcement of 2fa of new amazon-accounts. SMS or E-Mail is not supported.
You can extract the Secret from the QR-Code:
```
otpauth://totp/Amazon%3ASomeUser%40Example?secret=IBU3VLM........&issuer=Amazon
```
You need to setup the account in amazon with GoogleAuthenticator or any password-manager which supports OTP. Further
information here https://www.amazon.com/gp/help/customer/display.html?nodeId=GE6SLZ5J9GCNRW44

# Troubleshooting

## Timeout while trying to enter username

Make sure you are providing the plugin with the username or password in the options when instantiating it. If you're passing it via environment variables then the plugin will look for these two: `CYPRESS_googleSocialLoginUsername` and `CYPRESS_googleSocialLoginPassword`

If your application uses popup auth, make sure you are providing `isPopup: true` configuration parameter.

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
      username,
      password,
      loginUrl,
      headless: true,
      logs: false,
      loginSelector: 'a[href="/auth/auth0/google-oauth2"]',
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

# Author

Liran Tal <liran.tal@gmail.com>
