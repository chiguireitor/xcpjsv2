const axios = require('axios')

const BYTES_PER_USED_UTXO = 40

function pickUtxosOldestFirst(utxos, len, feePerByte, additionalNeededValue) {
  let feeSats = Math.round(len * feePerByte) + additionalNeededValue
  let ordered = utxos.sort((a, b) => b.height - a.height)
  let picked = []

  let totalVal = 0
  while (ordered.length > 0 && feeSats > 0) {
    let utxo = ordered.pop()
    //if (utxo.value > feePerByte * BYTES_PER_USED_UTXO) {
    if (utxo.value > feePerByte * BYTES_PER_USED_UTXO && utxo.value > 5430 && ((utxo.coinbase == 0) || (utxo.coinbase == 1 && utxo.confirmations > 100))) {
      picked.push(utxo)
      totalVal+= utxo.value - (feePerByte * BYTES_PER_USED_UTXO)
      if (totalVal - feeSats >= feeSats){
        break
      }
    }
  }
  totalVal -=feeSats

  if (totalVal > 0) {
    return {
      remainingUtxos: ordered,
      picked, change: totalVal
    }
  } else {
    throw new Error('Not enough balance, reduce fee')
  }
}

function deterministicSelect(h,n){

  const hs = h.substr(0,8)
  const fid = parseInt(hs,16)
  // hack for testing
  const functionary = fid % (n-1)

  return functionary
}


module.exports = (baseURL, filter) => {
  const client = axios.create({ baseURL })
  const utxoCache = {}
  return {
    forAddress: (addr, srcOps) => {

      if(!utxoCache[addr]){
        utxoCache[addr] = []
      }

      console.log('set utxo cache for ',addr,utxoCache)

      return {
        getChangeAddress: async () => {
          return addr
        },
        findUtxos: async (ops) => {

          console.log("findUtxos")
          //console.log(filter)

          console.log('utxoCache',utxoCache)

          if (utxoCache[addr].length === 0) {
            console.log('utxoCache[addr] is 0 !!!!')
            let utxos = await client.get('/a/' + addr + '/utxos')

            //filter utxo set deterministicly by % of number
            let utxodata = utxos.data
            if('deterministic' in filter && 'deterministicTarget' in filter){
              //console.log("found a filter")
              utxodata = []
              const d = filter['deterministic']
              for (var i = 0; i < utxos.data.length; i++) {
                const ds = deterministicSelect(utxos.data[i].txId,filter['deterministic'])
                if (ds == filter['deterministicTarget']){
                  utxodata.push(utxos.data[i])
                }
              }
            }

            utxoCache[addr] = utxodata

            console.log('cached utxos set ',utxoCache[addr].length)
          }

          if ('forceUtxo' in ops) {
            let idx = utxoCache[addr].indexOf(x => (x.txId === ops.txid) && (x.vout === ops.vout))

            if (idx >= 0) {
              let picked = [utxoCache[addr][idx]]
              utxoCache[addr].splice(idx, 1)

              return { utxos: picked, change: ops.forceUtxo.change}
            } else {
              throw new Error('UTXO not found')
            }
          } else if ('approximateByteLength' in ops && 'targetFeePerByte' in srcOps) {
            let {
              remainingUtxos,
              picked,
              change
            } = pickUtxosOldestFirst(utxoCache[addr], ops.approximateByteLength, srcOps.targetFeePerByte, ops.additionalNeededValue)

            utxoCache[addr] = remainingUtxos
            console.log('cached utxos set remaining',utxoCache[addr].length)
            return { utxos: picked, change }
          } else {
            return [utxoCache[addr].shift()]
          }
        }
      }
    }
  }
}
