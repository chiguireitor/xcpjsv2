require('dotenv').config()
const bitcoin = require('bitcoinjs-lib')
const xcpjsv2 = require('./')

const tx = "0200000001a40e3b6ea3c7d4fe6ec4761bba28567f98e6a8993cdf614583379f6e50851400010000006b483045022100862b279915aecff9575553f7a9af59192d0800a4a4ced4085067dde1458cdfd7022036d53fbd023899554be0eadb56b4bcb17d409775af4e0c1c4acebd99e0bbf9e501210387d6b0dbb9f13cca702baa237885aaf7b2e0143c5e180a4df5fa9e2e5eead265ffffffff020000000000000000686a4c651817be2cc39b4dec624b987e15a009b330f41ed33ba4001b301b0c07c6080536de198d81e92b3afcd92fe6abd0e9c96189300a212eb5b8026beb39e12174316150b911f46f2064c75e6b7276608144b2151139e879bf1f3c9dd29a0737bbaa7888382980448f2c0000000000001976a914f5aeeb5b076192f92a8a2d336d52173cf0636c7588ac00000000"

function testDecode() {
  console.log(xcpjsv2.decode(tx))
}

async function test() {
  xcpjsv2.setNetwork('regtest')
  xcpjsv2.setBroadcastService(xcpjsv2.services.transactionBroadcaster(process.env.BITCOIN_ENDPOINT))
  xcpjsv2.setUtxoService(xcpjsv2.services.indexdUtxos(process.env.INDEXD_HTTP_ENDPOINT))

  let addr = xcpjsv2.services.transactionSigner.wifKeyP2PKHSigner(
    'cVq91Cheu6T98m48gZTp3dMAijU9h5CA73dRjzLnwpXjVZkypiYQ', 'regtest') // Notice to hackers, this WIF doesn't works anywhere else, it's for regtest, 0 value ;)

  try {
    let sendResult = await xcpjsv2.send(addr, 'moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'XCP', '1', 'saludos')
    console.log('send result:', sendResult)

    /*let issuanceResult = await xcpjsv2.issuance('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'mjgjmY6npvcQraap2YVfTJFHK3TM68AbW6', 'SUSHIT', '1000', false, 'Esto es un temaki en realidad')
    console.log('issuance result:', issuanceResult)

    let orderResult = await xcpjsv2.order('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '10000', 'SUSHIT', '10000000')
    console.log('order result:', orderResult)

    let broadcastResult = await xcpjsv2.broadcast('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', Math.floor(Date.now()/1000), 0, null, 'Yo naci en esta rivera')
    console.log('broadcast result:', broadcastResult)

    let issuanceResult = await xcpjsv2.issuance('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'mjgjmY6npvcQraap2YVfTJFHK3TM68AbW6', 'PTRT', '1000', false, '5150c9e7269d71a031f23b95f1d94ad49015b98009d9cf90c53a8b27be376e7b')
    console.log('issuance result:', issuanceResult)*/
  } catch (e) {
    console.log('error:', e)
  }
}

//test()
testDecode()
