const bitcoin = require('bitcoinjs-lib')

const messages = require('./messages')
const envelopes = require('./envelopes')
const services = require('./services')

let network = bitcoin.networks['mainnet']
let utxoService, broadcastService


async function sendraw(source, destination, asset, quantity, memo, memoIsHex) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return _envelopeAndBuild_(source, msg, true)
}

async function send(source, destination, asset, quantity, memo, memoIsHex) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return _envelopeAndBuild_(source, msg, false)
}

async function order(source, giveAsset, giveQuantity, getAsset, getQuantity) {
  let msg = messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
  return _envelopeAndBuild_(source, msg, false)
}

async function issuance(source, transferDestination, asset, quantity, divisible, description) {
  let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
  return _envelopeAndBuild_(source, msg, false)
}

async function broadcast(source, timestamp, value, feeFraction, text) {
  let msg = messages.broadcast.compose(source, timestamp, value, feeFraction, text)
  return _envelopeAndBuild_(source, msg, false)
}

async function broadcastRawTx(tx){
  let broadcastResult = await broadcastService.broadcast(tx)
  return broadcastResult
}

async function _envelopeAndBuild_(source, msg, getraw) {
  let additionalOutputs = null
  if (typeof(msg) === 'object' && !Buffer.isBuffer(msg)) {
    additionalOutputs = msg.outputs
    msg = msg.msgData
  }

  let addrUtxoService = utxoService.forAddress(source, {
    targetFeePerByte: 10
  })
  let envelope = await envelopes.opreturn(msg, addrUtxoService, additionalOutputs)

  let unsignedTxBuilder = await services.transactionBuilder(network, envelope, additionalOutputs)
  await services.transactionSigner.sign(source, unsignedTxBuilder)

  let txHex = unsignedTxBuilder.build().toHex()

  if (getrawtx) {
    console.log(txHex)
    return txHex
  } else {
    let broadcastResult = await broadcastService.broadcast(txHex)
    return broadcastResult
  }

}

function setNetwork(name) {
  network = bitcoin.networks[name]
}

function setUtxoService(srv) {
  utxoService = srv
}

function setBroadcastService(srv) {
  broadcastService = srv
}

module.exports = {
  services,
  setNetwork,
  setUtxoService,
  setBroadcastService,
  send,
  order,
  issuance,
  broadcast
}
