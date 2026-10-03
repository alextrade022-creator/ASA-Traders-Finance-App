import DetailModal from './components/DetailModal'
import DrillModal from './components/DrillModal'
import Header from './components/Header'
import Tooltip from './components/Tooltip'
import { useApp } from './state/AppContext'
import Accounts from './views/Accounts'
import Consignments from './views/Consignments'
import Dashboard from './views/Dashboard'
import FixedCosts from './views/FixedCosts'

const VIEWS = {
  dashboard: Dashboard,
  entry: Consignments,
  fixed: FixedCosts,
  acc: Accounts,
}

export default function App() {
  const { ui } = useApp()
  const View = VIEWS[ui.view] || Dashboard

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1240px] px-4 pt-5.5 pb-15">
        <View />
      </main>
      <DetailModal />
      <DrillModal />
      <Tooltip />
    </div>
  )
}
