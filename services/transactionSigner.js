const bitcoin = require('bitcoinjs-lib')

const registeredSigners = {}

module.exports = {
  registerSigner: (addr, fn) => {
    registeredSigners[addr] = fn
  },

  unregisterSigner: (addr) => {
    delete registeredSigners[addr]
  },

  sign: async (src, tx, inputs) => {
    if (src in registeredSigners) {
      return await registeredSigners[src](tx, inputs)
    } else {
      return tx
    }
  },

  wifKeyP2PKHSigner: (wif, networkName) => {
    const network = bitcoin.networks[networkName]
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
  },

  wifKeyNP2PWKHSigner: (wif, networkName) => {
    const network = bitcoin.networks[networkName]
    const keyPair = bitcoin.ECPair.fromWIF(wif, network)
    const p2sh = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }),
      network
    })

    registeredSigners[p2sh.address] = async (tx, inputs) => {
      for (let i=0; i < tx.__inputs.length; i++) {
        try {
          tx.sign(i, keyPair, p2sh.redeem.output, null, inputs[i].value)
        } catch(e) {
          console.log(e)
        }
      }

      return tx
    }

    return p2sh.address
  }
}
