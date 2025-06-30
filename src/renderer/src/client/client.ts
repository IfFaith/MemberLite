type Client = {
  app: {
    close: () => void
    minimize: () => void
    maximize: () => void
    isMaximized: () => void
    openLog: () => void
  }
}
//@ts-ignore 暴露window身上的client
const client: Client = window.client

export default client
