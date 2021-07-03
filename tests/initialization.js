const ElGamal = require('../elgamal');
const debug = require('debug');
const bigInteger = require('big-integer');


const log = debug('app::ElGamal::Test');


async function test() {
    const elgamal = new ElGamal();
    await elgamal.initializeRemotely(2048);
    elgamal.setSecurityLevel('LOW');

    let g = bigInteger(elgamal.generator);
    let y = bigInteger(elgamal.publicKey);
    let p = bigInteger(elgamal.modulus);
    log('publicKey === modulus: ', y.equals(p));  
    let x = elgamal.privateKey;
    
}


test();