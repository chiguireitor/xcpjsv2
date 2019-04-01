const bitcoin = require('bitcoinjs-lib')
const BigNumber = require('bignumber.js')
const B26_DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function bn64be(bn) {
  if (typeof(bn) == 'string') {
    bn = new BigNumber(bn)
  }
  let res = bn.toString(16)
  while (res.length < 8) { res += '0' }
  return Buffer.from(res, 'hex')
}

module.exports = {
  bn64be,

  addressShortDecode: (addr) => {
    let data = bitcoin.address.fromBase58Check(addr)
    let vb = Buffer.alloc(1)
    vb.writeUInt8(data.version)

    return Buffer.concat([vb, data.hash])
  },

  getAssetId: (assetName) => {
    if (assetName.startsWith('A')) {
      throw new Error('Numeric assets not supported yet')
    } else {
      return bn64be(assetName.split('')
        .map(c => B26_DIGITS.indexOf(c))
        .reduce((n, digit) => {
          if (digit < 0) {
            throw new Error('Invalid asset name')
          }

          return n.multipliedBy(26).plus(digit)
        }, new BigNumber(0)))
    }
  }
}
