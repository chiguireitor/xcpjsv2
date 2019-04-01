const bitcoin = require('bitcoinjs-lib')

const registeredSigners = {}

module.exports = {
  registerSigner: (addr, fn) => {
    registeredSigners[addr] = fn
  },

  sign: async (src, tx) => {
    if (src in registeredSigners) {
      return await registeredSigners[src](tx)
    } else {
      return tx
    }
  },

  wifKeyP2PKHSigner: (wif, network) => {
    const keyPair = bitcoin.ECPair.fromWIF(wif, network)
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network })
    registeredSigners[address] = async (tx) => {
      for (let i=0; i < tx.__inputs.length; i++) {
        try {
          tx.sign(i, keyPair)
        } catch(e) {
          console.log(e)
        }
      }

      return tx
    }

    return address
  }
}
