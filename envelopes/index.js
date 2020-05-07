const PREFIX = Buffer.from('CNTRPRTY', 'utf8')

const addPrefix = (fn) => (data, utxoService, additionalOutputs,coinSelect,network) => {
  return fn(Buffer.concat([PREFIX, data]), utxoService, additionalOutputs,coinSelect,network)
}

const wrapFunction = (fn) => (addrUtxoService, amount, address,coinSelect, network) => {
  return fn(addrUtxoService, amount, address,coinSelect, network)
}

module.exports = {
  opreturn: addPrefix(require('./opreturn')),
  native: wrapFunction(require('./native'))
}
