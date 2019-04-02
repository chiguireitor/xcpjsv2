const BigNumber = require('bignumber.js')

const xcputil = require('../xcputil.js')
const ID = Buffer.from('1E', 'hex')

module.exports = {
  compose: (source, timestamp, value, feeFraction, text) => {
    let feeFractionBuff
    if (Number.isInteger(feeFraction)) {
      feeFractionBuff = xcputil.doIntBuffer(feeFraction)
    } else if (Number.isFinite(feeFraction) || typeof(feeFraction) === 'string') {
      feeFractionBuff = new BigNumber(fee_fraction).multipliedBy(100000000)
    } else {
      feeFractionBuff = xcputil.doIntBuffer(0)
    }

    let textBuff = Buffer.from(text, 'utf8')

    return Buffer.concat([
      ID,
      xcputil.doIntBuffer(timestamp),
      xcputil.doDoubleBuffer(value),
      feeFractionBuff,
  		xcputil.doVarIntBuffer(text.length),
  		textBuff
    ])
  }
}
