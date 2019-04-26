const bitcoin = require('bitcoinjs-lib')
const OPS = require('bitcoin-ops')
const xcputil = require('../xcputil')

// arc4: from https://github.com/visvirial/CounterJS
const arc4 = function(key, data) {
	if(typeof key == 'string') key = Buffer.from(key, 'hex');
	if(typeof data == 'string') data = Buffer.from(data, 'hex');
	var S = [];
	for(var i=0; i<256; i++) {
		S[i] = i;
	}
	for(var i=0,j=0; i<256; i++) {
		j = (j + S[i] + key[i % key.length]) % 256;
		[S[i], S[j]] = [S[j], S[i]];
	}
	var ret = [];
	for(var x=0,i=0,j=0; x<data.length; x++) {
		i = (i + 1) % 256;
		j = (j + S[i]) % 256;
		[S[i], S[j]] = [S[j], S[i]];
		var K = S[(S[i] + S[j]) % 256];
		ret.push(data[x] ^ K);
	}
	return Buffer.from(ret);
};

function op_push(len) {
  if (len < 0x4c) {
    let b = Buffer.alloc(1)
    b.writeUInt8(len)
    return b
  } else if (len <= 0xff) {
    let b = Buffer.alloc(2)
    b.writeUInt8(0x4c, 0)
    b.writeUInt8(len, 1)
    return b
  } else if (len <= 0xffff) {
    let b = Buffer.alloc(3)
    b.writeUInt8(0x4d, 0)
    b.writeUInt16LE(len, 1)
    return b
  } else {
    let b = Buffer.alloc(5)
    b.writeUInt8(0x4e, 0)
    b.writeUInt32LE(len, 1)
    return b
  }
}

function createChangeOutput(change, addr) {
  return xcputil.createValueOutput(addr, change)
}

module.exports = async (data, utxoService, additionalOutputs) => {
  let cryptData = data
  let additionalNeededValue = 0
  let estimatedLength = cryptData.length + 3

  if (additionalOutputs) {
    estimatedLength += additionalOutputs.length * 32 + additionalOutputs.reduce((p,x) => p + x.value, 0)
  }

  let coinSelect = await utxoService.findUtxos({
    approximateByteLength: estimatedLength,
    additionalNeededValue
  })

  if (coinSelect.utxos.length > 0) {
    let key = coinSelect.utxos[0].txId

    cryptData = arc4(key, cryptData)
  } else {
    throw new Error('No utxos for transaction')
  }

  let outputs = [
    {
      script: Buffer.concat([
        xcputil.doByteBuffer(OPS.OP_RETURN),
        op_push(cryptData.length),
        cryptData
      ]),
      value: 0
    }
  ]

  if (additionalOutputs) {
    additionalOutputs.forEach(out => {
      outputs.unshift(out)
      coinSelect.change -= out.value
    })
  }

  if (coinSelect.change > 0) {
    outputs.push(createChangeOutput(coinSelect.change, await utxoService.getChangeAddress()))
  }

  return { outputs, inputs: coinSelect.utxos }
}
