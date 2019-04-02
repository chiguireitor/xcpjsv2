require('dotenv').config()

const bitcoin = require('bitcoinjs-lib')

const messages = require('./messages')
const envelopes = require('./envelopes')
const services = require('./services')
const {
  indexdUtxos,
  transactionBuilder,
  transactionSigner,
  transactionBroadcaster
} = require('./services')

const network = bitcoin.networks[process.env.NETWORK]

async function send(source, destination, asset, quantity, memo, memoIsHex) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return _envelopeAndBuild_(source, msg)
}

async function order(source, giveAsset, giveQuantity, getAsset, getQuantity) {
  let msg = messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
  return _envelopeAndBuild_(source, msg)
}

async function issuance(source, transferDestination, asset, quantity, divisible, description) {
  let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
  return _envelopeAndBuild_(source, msg)
}

async function broadcast(source, timestamp, value, feeFraction, text) {
  let msg = messages.broadcast.compose(source, timestamp, value, feeFraction, text)
  return _envelopeAndBuild_(source, msg)
}

async function _envelopeAndBuild_(source, msg) {
  let utxoService = services.indexdUtxos(process.env.INDEXD_HTTP_ENDPOINT).forAddress(source, { targetFeePerByte: 1 })
  let additionalOutputs = null
  if (typeof(msg) === 'object' && !Buffer.isBuffer(msg)) {
    additionalOutputs = msg.outputs
    msg = msg.msgData
  }
  let envelope = await envelopes.opreturn(msg, utxoService, additionalOutputs)

  let unsignedTxBuilder = await services.transactionBuilder(network, envelope, additionalOutputs)
  await services.transactionSigner.sign(source, unsignedTxBuilder)

  let txHex = unsignedTxBuilder.build().toHex()
  let broadcastResult = await services.transactionBroadcaster(process.env.BITCOIN_ENDPOINT).broadcast(txHex)

  return broadcastResult
}

module.exports = {
  services,
  send, order, issuance, broadcast
}
