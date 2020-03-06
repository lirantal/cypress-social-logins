export default class Homepage {
  constructor() {}

  visit() {
    cy.visit('/account')

    cy.getCookies().then(cookies => {
      // inspect cookies if required
    })
  }

  getAccountNavs() {
    cy.get('.vue--section-header').contains('Account Settings')
  }
}
