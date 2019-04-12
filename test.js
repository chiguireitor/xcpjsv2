require('dotenv').config()
const bitcoin = require('bitcoinjs-lib')
const xcpjsv2 = require('./')

async function test() {
  xcpjsv2.setNetwork('regtest')
  xcpjsv2.setBroadcastService(xcpjsv2.services.transactionBroadcaster(process.env.BITCOIN_ENDPOINT))
  xcpjsv2.setUtxoService(xcpjsv2.services.indexdUtxos(process.env.INDEXD_HTTP_ENDPOINT))

  let addr = xcpjsv2.services.transactionSigner.wifKeyP2PKHSigner(
    'cVq91Cheu6T98m48gZTp3dMAijU9h5CA73dRjzLnwpXjVZkypiYQ', 'regtest') // Notice to hackers, this WIF doesn't works anywhere else, it's for regtest, 0 value ;)

  try {
    /*let sendResult = await xcpjsv2.send(addr, 'moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '1', 'saludos')
    console.log('send result:', sendResult)

    let issuanceResult = await xcpjsv2.issuance('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'mjgjmY6npvcQraap2YVfTJFHK3TM68AbW6', 'SUSHIT', '1000', false, 'Esto es un temaki en realidad')
    console.log('issuance result:', issuanceResult)

    let orderResult = await xcpjsv2.order('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '10000', 'SUSHIT', '10000000')
    console.log('order result:', orderResult)

    let broadcastResult = await xcpjsv2.broadcast('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', Math.floor(Date.now()/1000), 0, null, 'Yo naci en esta rivera')
    console.log('broadcast result:', broadcastResult)*/

    let issuanceResult = await xcpjsv2.issuance('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'mjgjmY6npvcQraap2YVfTJFHK3TM68AbW6', 'PTRT', '1000', false, '5150c9e7269d71a031f23b95f1d94ad49015b98009d9cf90c53a8b27be376e7b')
    console.log('issuance result:', issuanceResult)
  } catch (e) {
    console.log('error:', e)
  }
}

test()
