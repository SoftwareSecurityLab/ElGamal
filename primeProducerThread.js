const bigInteger = require('big-integer');
const crypto = require('crypto');
const jsbn = require('jsbn').BigInteger;
const thread = require('threads');





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

thread.expose({
    async producePrime(bitLength){
        let count = 0;
        let prime = await asyncCryptoRandomGenerator(Math.ceil(bitLength/8));
        prime = bigInteger(prime.toString('hex'),16);
        //make sure we have the proper length:
        prime = prime.shiftLeft(bitLength - prime.bitLength());
        //while the produced number can be even then it couldn't be prime:
        prime = prime.or(1);
        while(!prime.isProbablePrime()){
            while(!prime.isProbablePrime()){
                prime = prime.add(2);
            }
        }
        console.log(prime.bitLength());
        return prime;
    }
})