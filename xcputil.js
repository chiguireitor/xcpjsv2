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

function doDoubleBuffer(v) {
  let b = Buffer.alloc(8)
  b.writeDoubleBE(v)
  return b
}

function doVarIntBuffer(v) {
  if (v < 0) {
    throw new Error('varints cannot be negative')
  } else if (v <= 0xfc) {
    let b = Buffer.alloc(1)
    b.writeUInt8(v)

    return b
  } else if (v <= 0xffff) {
    let b = Buffer.alloc(3)
    b.writeUInt8(0xfd)
    b.writeUInt16BE(v, 1)

    return b
  } else if (v <= 0xffffffff) {
    let b = Buffer.alloc(5)
    b.writeUInt8(v)
    b.writeUInt8(0xfe)
    b.writeUInt32BE(v, 1)

    return b
  } else {
    // This shouldn't happen, javascript doesn't supports 64 bits integers
    throw new Error('varint encoding of a weird int value: ' + v)
    // let b = Buffer.alloc(9)
    // b.writeUInt8(0xff)
    // b.writeUInt64BE(v, 1) // Use bignumber here
    // return b
  }
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

function bn32be(bn) {
  if (typeof(bn) == 'string') {
    bn = new BigNumber(bn)
  }
  let res = bn.toString(8)
  while (res.length < 8) { res = '0' + res } // Little endian
  return Buffer.from(res, 'hex')
}

function createValueOutput(addr, value, network) {
  let data = bitcoin.address.fromBase58Check(addr)
  return {
    value: value,
    script: bitcoin.address.toOutputScript(addr, network)
    /*bitcoin.script.compile([
      OPS.OP_DUP,
      OPS.OP_HASH160,
      data.hash,
      OPS.OP_EQUALVERIFY,
      OPS.OP_CHECKSIG
    ])*/
  }
}

module.exports = {
  bn32be,
  bn64be,
  intToHalf,
  doByteBuffer,
  doIntBuffer,
  doVarIntBuffer,
  doFloatBuffer,
  doDoubleBuffer,
  createValueOutput,

  addressShortDecode: (addr) => {
    let data = bitcoin.address.fromBase58Check(addr)
    let vb = Buffer.alloc(1)
    vb.writeUInt8(data.version)

    return Buffer.concat([vb, data.hash])
  },

  getAssetId: (assetName) => {
    if (assetName.startsWith('A')) {
      let bn = new BigNumber(assetName.slice(1))

      return bn64be(bn)
    } else if (assetName === 'BTC') {
      return Buffer.from('0000000000000000', 'hex')
    } else if (assetName === 'XCP') {
      return Buffer.from('0000000000000001', 'hex')
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
