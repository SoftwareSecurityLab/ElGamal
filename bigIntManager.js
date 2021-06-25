const bigInteger = require('big-integer');
const crypto = require('crypto');
const jsbn = require('jsbn').BigInteger;
const thread = require('threads');
const debug = require('debug');


const log = debug('app::bigIntegerManager');

function trim(number, numberOfLength){
    
}


async function asyncCryptoRandomGenerator(length){
    return new Promise((resolve, reject)=>{
        crypto.randomBytes(length ,(err, buff)=>{
            if(err)
                reject(err);
            resolve(buff);
        })
    })
}



/**
 * This function doesn't produce the prime numbers exactly with same length of bits,
 * so it's better to pass it one less than your target bits and check it yourself to be prime.
 * @param {integer} bitLength indicate the length of digits in binary representation.
 */

async function getPrime(bitLength){
    const primeProducer = await thread.spawn(new thread.Worker('./primeProducerThread'));
    const prime = await primeProducer.producePrime(bitLength);
    await thread.Thread.terminate(primeProducer);
    return bigInteger(prime.value);
}


/**
 * 
 * @param {bigInteger.BigInteger} max excluded
 * @param {number|bigInteger.BigInteger} min included
 * @returns {Promise<bigInteger.BigInteger>}
 */
async function randomGeneratorInRange(max, min){
    const range = max.subtract(min).subtract(1);
    let bi = undefined;
    do {
        const buffer = await asyncCryptoRandomGenerator(Math.ceil(range.bitLength()/8));
        bi = bigInteger(buffer.toString('hex'), 16).add(min);
    } while (bi.compare(max) >= 0);
    return bi;
}

module.exports.getInRange = randomGeneratorInRange;
module.exports.getPrime = getPrime;