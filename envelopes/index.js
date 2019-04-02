const PREFIX = Buffer.from('CNTRPRTY', 'utf8')

const addPrefix = (fn) => (data, utxoService, additionalOutputs) => {
  return fn(Buffer.concat([PREFIX, data]), utxoService, additionalOutputs)
}

module.exports = {
  opreturn: addPrefix(require('./opreturn'))
}
