const BitcoinRpc = require('bitcoin-rpc-promise')

module.exports = baseURL => {
  const btc = new BitcoinRpc(baseURL)

  let broadcaster = {
    broadcast: async txHex => {
      try {
        let res = await btc.sendrawtransaction(txHex)

        return res
      } catch (e) {
        console.log(typeof e)
        throw e
      }
    }
  }

  return broadcaster
}
