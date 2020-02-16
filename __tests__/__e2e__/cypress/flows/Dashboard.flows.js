import Dashboard from '../PageObjects/Dashboard/Dashboard'
const dashboard = new Dashboard()

export const assertUserAccount = () => {
  describe('Homepage view', () => {
    before(() => {
      dashboard.visit()
    })

    it('User account sub-navs listed', () => {
      dashboard.getAccountNavs()
    })
  })
}
