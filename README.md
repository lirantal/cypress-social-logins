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
  <a href="https://travis-ci.org/lirantal/cypress-social-logins"><img src="https://badgen.net/travis/lirantal/cypress-social-logins" alt="build"/></a>
  <a href="https://snyk.io/test/github/lirantal/cypress-social-logins"><img src="https://snyk.io/test/github/lirantal/cypress-social-logins/badge.svg" alt="Known Vulnerabilities"/></a>
  <a href="https://github.com/nodejs/security-wg/blob/master/processes/responsible_disclosure_template.md"><img src="https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg" alt="Security Responsible Disclosure" /></a>
</p>

# About

This Cypress library makes it possible to perform third-party logins (think oauth) for services such as GitHub, Google or Facebook.

It does so by delegating the login process to a `puppeteer` flow that performs the login and returns the cookies for the application under test so they can be set by the calling Cypress flow for the duration of the test.

## Support

Supported identity providers:

| Provider | Plugin name       |
| -------- | ----------------- |
| Google   | GoogleSocialLogin |
| GitHub   | TBD               |
| Facebook | TBD               |
| Twitter  | TBD               |
| LinkedIn | TBD               |

# Usage

1. Call the declared task with a set of options for the social login flow interaction
2. Set the cookies for the test flow with the help of `Cypress.Cookies.defaults`

```js
cy.clearCookies()

return cy.task('GoogleSocialLogin', socialLoginOptions).then(({cookies}) => {
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
      whitelist: cookieName
    })
  }
})
```

Options passed to the task include:

| Option name       | Description                                                                                                           | Example                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| username          |                                                                                                                       |
| password          |                                                                                                                       |
| loginUrl          | The URL for the login page that includes the social network buttons                                                   | https://www.example.com/login           |
| headless          | Whether to run puppeteer in headless more or not                                                                      | true                                    |
| logs              | Whether to log interaction with the loginUrl website & cookie data                                                    | false                                   |
| loginSelector     | A selector on the page that defines the specific social network to use and can be clicked, such as a button or a link | `'a[href="/auth/auth0/google-oauth2"]'` |
| postLoginSelector | A selector on the post-login page that can be asserted upon to confirm a successful login                             | `'.account-panel'`                      |

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

    const cookieName = Cypress.env('cookieName')
    const socialLoginOptions = {
      username,
      password,
      loginUrl: Cypress.env('loginUrl'),
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
          whitelist: cookieName
        })
      }
    })
  })
})
```

# Author

Liran Tal <liran.tal@gmail.com>
