const bitcoin = require('bitcoinjs-lib')

const messages = require('./messages')
const envelopes = require('./envelopes')
const services = require('./services')

const {
  MAGIC_STRING, P2PKH_VERSIONBYTE,
  reverse,
  arc4,
  idToAsset,
  decodePubkeyToAddress
} = require('./xcputil')

let network = bitcoin.networks['mainnet']
let utxoService, broadcastService
let stochasticPick = false
let currentTargetFeePerByte = 1

async function send(source, destination, asset, quantity, memo, memoIsHex) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return _envelopeAndBuild_(source, msg)
}

async function order(source, giveAsset, giveQuantity, getAsset, getQuantity) {
  let msg = messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
  return _envelopeAndBuild_(source, msg)
}

async function issuance(source, transferDestination, asset, quantity, divisible, description) {
  let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description, network)
  return _envelopeAndBuild_(source, msg)
}

async function broadcast(source, timestamp, value, feeFraction, text) {
  let msg = messages.broadcast.compose(source, timestamp, value, feeFraction, text)
  return _envelopeAndBuild_(source, msg)
}

async function cancel(source, offerHash) {
  let msg = messages.cancel.compose(source, offerHash)
  return _envelopeAndBuild_(source, msg)
}

async function _envelopeAndBuild_(source, msg) {
  let additionalOutputs = null
  if (typeof(msg) === 'object' && !Buffer.isBuffer(msg)) {
    additionalOutputs = msg.outputs
    msg = msg.msgData
  }

  let addrUtxoService = utxoService.forAddress(source, { targetFeePerByte: currentTargetFeePerByte, stochasticPick })
  let envelope = await envelopes.opreturn(msg, addrUtxoService, additionalOutputs, network)

  let unsignedTxBuilder = await services.transactionBuilder(network, envelope, additionalOutputs)
  let rawTx = await services.transactionSigner.sign(source, unsignedTxBuilder, envelope.inputs)

  if (typeof(rawTx) === 'string') {
    let broadcastResult = await broadcastService.broadcast(rawTx)

    return broadcastResult
  } else {
    let txHex = unsignedTxBuilder.build().toHex()
    console.log(txHex)
    let broadcastResult = await broadcastService.broadcast(txHex)

    return broadcastResult
  }
}

function setNetwork(name) {
  if (typeof(name) === 'string') {
    network = bitcoin.networks[name]
  } else {
    network = name
  }
}

function setUtxoService(srv) {
  utxoService = srv
}

function setBroadcastService(srv) {
  let old = broadcastService
  broadcastService = srv
  return old
}

function setStochasticPick(val) {
  stochasticPick = val
}

function setCurrentTargetFeePerByte(n) {
  currentTargetFeePerByte = n
}

function unpack(data) {
  let type = data.readUInt8()

  for (let x in messages) {
    let msgType = messages[x]
    if ('ID' in msgType) {
      if (msgType.ID.readUInt8() === type) {
        return msgType.unpack(data.slice(1))
      }
    }
  }
}

function decode(data) {
  if (typeof(data) === 'string') {
    data = Buffer.from(data, 'hex')
  }

  let tx = bitcoin.Transaction.fromBuffer(data)
  let dataVout = tx.outs.filter(x => x.value === 0).pop()

  if (!dataVout) {
    let odataVout = tx.outs.filter(x => x.value >= 7799 && x.value <= 7800)
    if (odataVout.length > 0) {
      dataVout = odataVout
          .map(x =>
                bitcoin.script.decompile(x.script)
                  .filter(x => Buffer.isBuffer(x))
                  .map(x => x.toString('hex').slice(2,-2))
                  .slice(0,-1).join('')
              )
          .map(x => Buffer.from(x, 'hex'))
    }
  } else {
    dataVout = [bitcoin.script.decompile(dataVout.script).pop()]
  }

  if (dataVout) {
    let txin = tx.ins[0]
    let decomp = bitcoin.script.decompile(txin.script)
    if (Buffer.isBuffer(decomp[1])) {
      let srcAddress = decodePubkeyToAddress(decomp[decomp.length - 1])
      let key = tx.ins[0].hash
      let dataEncoded = dataVout

      let rkey = reverse(key)
      let data = dataEncoded.map(x => arc4(rkey, x))
      if (data.length > 1) {
        data = data.map(x => x.slice(1))
        data = [data[0],
          ...(data.slice(1)
            .filter(x => x.slice(0,8).toString('utf8') === MAGIC_STRING)
            .map(x => x.slice(8)))]
        data = Buffer.concat(data)
      } else {
        data = data.pop()
      }

      if (data.slice(0,8).toString('utf8') === MAGIC_STRING) {
        let cptx = unpack(data.slice(8))

        if (cptx) {
          cptx.from = srcAddress

          /*if (cptx.type === 'issuance') { // This will be needed for issuance decoding
            let p2pkhVout = tx.outs.filter(x => x.value <= 5460).shift()
            let decompiled = bitcoin.script.decompile(p2pkhVout.script)

            if (decompiled.length > 3 && Buffer.isBuffer(decompiled[2])) {
              let pkh = decompiled[2]
              let destination = bs58check.encode(Buffer.concat([Buffer.from([P2PKH_VERSIONBYTE ]), Buffer.from(pkh)]))
              cptx.to = destination
            }
          }*/

          return cptx
        }
      }
    }
  }
}

module.exports = {
  services, setNetwork, setUtxoService, setBroadcastService, setStochasticPick,
  setCurrentTargetFeePerByte, decode,
  envelopeAndBuild: _envelopeAndBuild_,
  send, order, issuance, broadcast, cancel
}
