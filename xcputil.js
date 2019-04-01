const bitcoin = require('bitcoinjs-lib')
const OPS = require('bitcoin-ops')
const BigNumber = require('bignumber.js')
const B26_DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function doByteBuffer(v) {
  let b = Buffer.alloc(1)
  b.writeUInt8(v)
  return b
}

function doIntBuffer(v) {
  let b = Buffer.alloc(4)
  b.writeUInt32BE(v)
  return b
}

function doFloatBuffer(v) {
  let b = Buffer.alloc(4)
  b.writeFloatBE(v)
  return b
}

function intToHalf(i) {
  let buff = Buffer.alloc(2)
  buff.writeUInt16BE(i)
  return buff
}

function bn64be(bn) {
  if (typeof(bn) == 'string') {
    bn = new BigNumber(bn)
  }
  let res = bn.toString(16)
  while (res.length < 16) { res = '0' + res } // Little endian
  return Buffer.from(res, 'hex')
}

function createValueOutput(addr, value) {
  let data = bitcoin.address.fromBase58Check(addr)
  return {
    value: value,
    script: bitcoin.script.compile([
      OPS.OP_DUP,
      OPS.OP_HASH160,
      data.hash,
      OPS.OP_EQUALVERIFY,
      OPS.OP_CHECKSIG
    ])
  }
}

module.exports = {
  bn64be,
  intToHalf,
  doByteBuffer,
  doIntBuffer,
  doFloatBuffer,
  createValueOutput,

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
