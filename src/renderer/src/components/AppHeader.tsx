import electronLogo from '../assets/electron.svg'
import close from '../assets/images/close.png'
import maximize from '../assets/images/maximize.png'
import minimize from '../assets/images/minimize.png'
import Client from '../client/client'

function AppHeader(): React.JSX.Element {
  const closeFn = (): void => {
    Client.app.close()
  }
  const maximizeFn = (): void => {
    Client.app.maximize()
  }
  const minimizeFn = (): void => {
    Client.app.minimize()
  }
  return (
    <div className="app-header">
      <div className="app-header-left">
        <img className="app-header-logo" src={electronLogo} alt="logo" />
      </div>
      <div className="app-header-right">
        <div onClick={minimizeFn} className="app-header-right-item">
          <img src={minimize} />
        </div>
        <div onClick={maximizeFn} className="app-header-right-item">
          <img src={maximize} />
        </div>
        <div onClick={closeFn} className="app-header-right-item">
          <img src={close} />
        </div>
      </div>
    </div>
  )
}

export default AppHeader
