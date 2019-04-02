const bitcoin = require('bitcoinjs-lib')
const xcpjsv2 = require('./')

async function test() {
  let addr = xcpjsv2.services.transactionSigner.wifKeyP2PKHSigner(
    'cVq91Cheu6T98m48gZTp3dMAijU9h5CA73dRjzLnwpXjVZkypiYQ', bitcoin.networks['regtest'])

  try {
    /*let sendResult = await xcpjsv2.send(addr, 'moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '1', 'saludos')
    console.log('result:', sendResult)*/

    /*let orderResult = await xcpjsv2.order('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'BTCT', '10000', 'VEFT', '10000000')
    console.log('result:', orderResult)*/

    /*let issuanceResult = await xcpjsv2.issuance('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', 'mjgjmY6npvcQraap2YVfTJFHK3TM68AbW6', 'SUSHIT', '1000', false, 'Esto es un temaki en realidad')
    console.log('result:', issuanceResult)*/

    /*let broadcastResult = await xcpjsv2.broadcast('moW4Lpj4v21VG6UymuYrpL3cC1KcaPc6Z8', Math.floor(Date.now()/1000), 0, null, 'Yo naci en esta rivera')
    console.log('result:', broadcastResult)*/
  } catch (e) {
    console.log('error:', e)
  }
  //console.log()
  //console.log(await order(addr, 'PEPECASH', '10000', 'SUSHI', '2000'))
}

test()
