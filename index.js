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

async function issuance(source, transferDestination, asset, quantity, divisible, description) {
  let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
  return envelopeAndBuild(source, msg)
}

async function envelopeAndBuild(source, msg) {
  let utxoService = indexdUtxos(process.env.INDEXD_HTTP_ENDPOINT).forAddress(source, { targetFeePerByte: 1 })
  let additionalOutputs = null
  if (typeof(msg) === 'object') {
    additionalOutputs = msg.outputs
    msg = msg.msgData
  }
  let envelope = await envelopes.opreturn(msg, utxoService)

  let unsignedTxBuilder = await transactionBuilder(network, envelope, additionalOutputs)
  await transactionSigner.sign(source, unsignedTxBuilder)

  let txHex = unsignedTxBuilder.build().toHex()
  console.log(txHex)
  let broadcastResult = await transactionBroadcaster(process.env.BITCOIN_ENDPOINT).broadcast(txHex)

  return broadcastResult
}

async function test() {
  let addr = transactionSigner.wifKeyP2PKHSigner('cVq91Cheu6T98m48gZTp3dMAijU9h5CA73dRjzLnwpXjVZkypiYQ', network)

  try {
    /*let sendResult = await send(addr, 'moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '1', 'saludos')
    console.log('result:', sendResult)*/

    /*let orderResult = await order('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '10000', 'VEFT', '10000000')
    console.log('result:', orderResult)*/

    let issuanceResult = await issuance('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'mjgjmY6npvcQraap2YVfTJFHK3TM68AbW6', 'SUSHIT', '1000', false, 'Esto es un temaki en realidad')
    console.log('result:', issuanceResult)
  } catch (e) {
    console.log('error:', e)
  }
  //console.log()
  //console.log(await order(addr, 'PEPECASH', '10000', 'SUSHI', '2000'))
}

test()
