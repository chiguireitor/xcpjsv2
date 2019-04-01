const axios = require('axios')

module.exports = baseURL => {
  const client = axios.create({ baseURL })

  let broadcaster = {
    auth: (addr, token) => {

    },

    broadcast: async txHex => {
      let res = await client.post('/sendtx', {
        data: { rawtx: txHex }
      })

      return res
    }
  }

  return broadcaster
}
