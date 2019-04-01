require('dotenv').config()

const bitcoin = require('bitcoinjs-lib')

const messages = require('./messages')
const envelopes = require('./envelopes')
const indexdUtxos = require('./services/indexdUtxos')
const transactionBuilder = require('./services/transactionBuilder')
const transactionSigner = require('./services/transactionSigner')
const transactionBroadcaster = require('./services/transactionBroadcaster')

const network = bitcoin.networks[process.env.NETWORK]

async function send(source, destination, asset, quantity, memo, memoIsHex) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return envelopeAndBuild(source, msg)
}

async function order(source, giveAsset, giveQuantity, getAsset, getQuantity) {
  let msg = messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
  return envelopeAndBuild(source, msg)
}

async function envelopeAndBuild(source, msg) {
  let utxoService = indexdUtxos(process.env.INDEXD_HTTP_ENDPOINT).forAddress(source, { targetFeePerByte: 1 })
  let envelope = await envelopes.opreturn(msg, utxoService)

  let unsignedTxBuilder = await transactionBuilder(network, envelope)
  await transactionSigner.sign(source, unsignedTxBuilder)

  let txHex = unsignedTxBuilder.build().toHex()
  let broadcastResult = await transactionBroadcaster(process.env.API_HTTP_ENDPOINT).broadcast(txHex)

  return broadcastResult
}

async function test() {
  let addr = transactionSigner.wifKeyP2PKHSigner('cSYXaP1UYAu4Fx9WqSMZVPSTq2yHAhzd4uqeF1LXTijfTCGVuRmQ', network)

  try {
    let sendResult = await send(addr, 'mhzdTjjQZtufRbpYjTxBJ2onfZYEjMNrHG', 'SUSHI', '2000', 'saludos')
    console.log('result:', sendResult)
  } catch (e) {
    console.log('error:', e)
  }
  //console.log()
  //console.log(await order(addr, 'PEPECASH', '10000', 'SUSHI', '2000'))
}

test()
