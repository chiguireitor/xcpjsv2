XCPJSv2:
======

A modern javascript library for Counterparty (XCP)

Usage:

```javascript
xcpjsv2.setNetwork('regtest') // optional
xcpjsv2.setBroadcastService(xcpjsv2.services.transactionBroadcaster(process.env.BITCOIN_ENDPOINT))
xcpjsv2.setUtxoService(xcpjsv2.services.indexdUtxos(process.env.INDEXD_HTTP_ENDPOINT))
let addr = xcpjsv2.services.transactionSigner.wifKeyP2PKHSigner(yourWif, bitcoin.networks['regtest']) // optional Network parameter
let sendResult = await xcpjsv2.send(sourceAddress, destinationAddress, asset, amount, memo)
console.log('send result:', sendResult)
```
