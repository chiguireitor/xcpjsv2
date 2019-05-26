const bitcoin = require('bitcoinjs-lib')

const registeredSigners = {}

module.exports = {
  registerSigner: (addr, fn) => {
    registeredSigners[addr] = fn
  },

  sign: async (src, tx) => {
    for (src in registeredSigners) {
        await registeredSigners[src](tx)
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
  
  wifKeyP2SHSigner: (pubkeys, wif, m, networkName) => {
    const network = bitcoin.networks[networkName]
    const keyPair = bitcoin.ECPair.fromWIF(wif, network)
    const pkeys = pubkeys.map((hex) => Buffer.from(hex, 'hex'))
    const p2ms = bitcoin.payments.p2ms({ m: m, pubkeys: pkeys, network: network })
    const p2sh = bitcoin.payments.p2sh({ redeem: p2ms, network: network })
    const address = p2sh.address
    registeredSigners[keyPair.publicKey.toString("hex")] = async (tx) => {
      for (let i=0; i < tx.__inputs.length; i++) {
        try {
          tx.sign(i, keyPair,p2sh.redeem.output)
        } catch(e) {
          console.log(e)
        }
      }
      return tx
    }

    return address
  },

  wifKeyP2SHP2WSHSigner: (pubkeys, wif, m, networkName) => {
    const network = bitcoin.networks[networkName]
    const keyPair = bitcoin.ECPair.fromWIF(wif, network)
    const pkeys = pubkeys.map((hex) => Buffer.from(hex, 'hex'))
    const p2ms = bitcoin.payments.p2ms({ m: m, pubkeys: pkeys, network: network })
    const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network: network })
    const p2sh = bitcoin.payments.p2sh({ redeem: p2wsh, network: network })
    const address = p2sh.address
    registeredSigners[keyPair.publicKey.toString("hex")] = async (tx) => {
      for (let i=0; i < tx.__inputs.length; i++) {
        try {
          tx.sign(i, keyPair,p2sh.redeem.output)
        } catch(e) {
          console.log(e)
        }
      }
      return tx
    }

    return address
  }
  
}
