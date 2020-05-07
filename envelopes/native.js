const bitcoin = require('bitcoinjs-lib')
const rc4 = require('arc4')
const OPS = require('bitcoin-ops')
const xcputil = require('../xcputil')

function createChangeOutput(change, addr, network) {
  return xcputil.createValueOutput(addr, change, network)
}

module.exports = async function (utxoService, amountInSatoshis, address, cs, network){

  //console.log("opreturn params", data, utxoService, additionalOutputs, cs)
  let outputs = []
  let additionalNeededValue = amountInSatoshis

  let estimatedLength = 36

  let coinSelect = null
  if(!cs){
    console.log('calling findUtxos')
    coinSelect = await utxoService.findUtxos({
        approximateByteLength: estimatedLength,
        additionalNeededValue
    })
  } else {
    coinSelect = cs
  }

  if (coinSelect.change > 0) {
    outputs.push(createChangeOutput(coinSelect.change, await utxoService.getChangeAddress(),network))
  }

  return { outputs, coinSelect: coinSelect }
}
