const PREFIX = Buffer.from('CNTRPRTY', 'utf8')

const addPrefix = (fn) => (data, utxoService, additionalOutputs,coinSelect) => {
  return fn(Buffer.concat([PREFIX, data]), utxoService, additionalOutputs,coinSelect)
}

module.exports = {
  opreturn: addPrefix(require('./opreturn'))
}
