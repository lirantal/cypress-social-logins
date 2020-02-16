import * as DashboardFlows from '../flows/Dashboard.flows'
import * as InfraFlows from '../flows/Infra.flows'

describe('Account Dashboard', () => {
  InfraFlows.login()
  DashboardFlows.assertUserAccount()
})
