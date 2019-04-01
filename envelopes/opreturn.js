const bitcoin = require('bitcoinjs-lib')
const rc4 = require('arc4')
const OPS = require('bitcoin-ops')

function op_push(len) {
  if (len < 0x4c) {
    let b = Buffer.alloc(1)
    b.writeUInt8(len)
    return b
  } else if (len <= 0xff) {
    let b = Buffer.alloc(2)
    b.writeUInt8(0x4c, 1)
    b.writeUInt8(len, 1)
    return b
  } else if (len <= 0xffff) {
    let b = Buffer.alloc(3)
    b.writeUInt8(0x4d, 1)
    b.writeUInt16LE(len, 1)
    return b
  } else {
    let b = Buffer.alloc(5)
    b.writeUInt8(0x4e, 1)
    b.writeUInt32LE(len, 1)
    return b
  }
}

function createChangeOutput(change, addr) {
  let data = bitcoin.address.fromBase58Check(addr)
  return {
    value: change,
    script: bitcoin.script.compile([
      OPS.OP_DUP,
      OPS.OP_HASH160,
      data.hash,
      OPS.OP_EQUALVERIFY,
      OPS.OP_CHECKSIG
    ])
  }
}

module.exports = async (data, utxoService) => {
  let cryptData = data

  let coinSelect = await utxoService.findUtxos({
    approximateByteLength: cryptData.length + 3
  })

  if (coinSelect.utxos.length > 0) {
    let key = coinSelect.utxos[0].txId

    let cipher = rc4('arc4', key)
    cryptData = cipher.encodeBuffer(cryptData)
  } else {
    throw new Error('No utxos for transaction')
  }

  let outputs = [
    {
      script: bitcoin.script.compile([
        OPS.OP_RETURN,
        op_push(cryptData.length),
        cryptData
      ]),
      value: 0
    }
  ]

  if (coinSelect.change > 0) {
    outputs.push(createChangeOutput(coinSelect.change, await utxoService.getChangeAddress()))
  }

  return { outputs, inputs: coinSelect.utxos }
}
