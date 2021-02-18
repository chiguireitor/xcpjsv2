const bitcoin = require('bitcoinjs-lib')

const messages = require('./messages')
const envelopes = require('./envelopes')
const services = require('./services')

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

module.exports = {
  services, setNetwork, setUtxoService, setBroadcastService, setStochasticPick,
  setCurrentTargetFeePerByte,
  envelopeAndBuild: _envelopeAndBuild_,
  send, order, issuance, broadcast, cancel
}
