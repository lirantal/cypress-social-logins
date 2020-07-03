const path = require('path')

export const login = ({
  username = Cypress.env('googleSocialLoginUsername'),
  password = Cypress.env('googleSocialLoginPassword')
} = {}) => {
  describe('Login', () => {
    it('Login through Google', () => {
      const cookieName = Cypress.env('cookieName')
      const socialLoginOptions = {
        username,
        password,
        loginUrl: Cypress.env('loginUrl'),
        headless: true,
        logs: true,
        loginSelector: 'a[href="/auth/auth0/google-oauth2"]',
        postLoginSelector: '.account-panel',
        // args: ['--no-sandbox', '--disable-setuid-sandbox']
        args: ['--no-sandbox'],
        screenshotsPathWhenFailed: './debug',
        cookieDelay: 300
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
}

export const logout = () => {
  describe('Logout', () => {
    it('Logout from app', () => {
      Cypress.clearCookies()
    })
  })
}
