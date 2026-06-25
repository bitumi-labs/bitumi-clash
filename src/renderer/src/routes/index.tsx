import { Navigate } from 'react-router-dom'
import Proxies from '@renderer/pages/proxies'
import Rules from '@renderer/pages/rules'
import Settings from '@renderer/pages/settings'
import Profiles from '@renderer/pages/profiles'
import Logs from '@renderer/pages/logs'
import Connections from '@renderer/pages/connections'
import Mihomo from '@renderer/pages/mihomo'
import Sysproxy from '@renderer/pages/syspeoxy'
import Tun from '@renderer/pages/tun'
import Resources from '@renderer/pages/resources'
import DNS from '@renderer/pages/dns'
import Sniffer from '@renderer/pages/sniffer'
import SettingsChanged from '@renderer/pages/settings-changed'
import SettingsTabs from '@renderer/pages/settings-tabs'
import Home from '@renderer/pages/home'
const routes = [
  {
    path: '/settings/mihomo',
    element: <Mihomo />
  },
  {
    path: '/settings/sysproxy',
    element: <Sysproxy />
  },
  {
    path: '/settings/tun',
    element: <Tun />
  },
  {
    path: '/proxies',
    element: <Proxies />
  },
  {
    path: '/rules',
    element: <Rules />
  },
  {
    path: '/rules/resources',
    element: <Resources />
  },
  {
    path: '/settings/dns',
    element: <DNS />
  },
  {
    path: '/settings/sniffer',
    element: <Sniffer />
  },
  {
    path: '/logs',
    element: <Logs />
  },
  {
    path: '/connections',
    element: <Connections />
  },
  {
    path: '/profiles',
    element: <Profiles />
  },
  {
    path: '/settings',
    element: <Settings />
  },
  {
    path: '/settings/changed',
    element: <SettingsChanged />
  },
  {
    path: '/settings/tabs',
    element: <SettingsTabs />
  },
  {
    path: '/',
    element: <Navigate to="/home" />
  },
  {
    path: '/home',
    element: <Home />
  }
]

export default routes
