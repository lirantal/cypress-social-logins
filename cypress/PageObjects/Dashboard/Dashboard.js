export default class Homepage {
  constructor() {}

  visit() {
    cy.visit('/account')

    cy.getCookies().then(cookies => {
      // inspect cookies if required
    })
  }

  getAccountNavs() {
    cy.get('[data-snyk-test="header title"]').contains('Account Settings')
  }
}
