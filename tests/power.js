const bigInteger = require('big-integer');
const ElGamal = require('../elgamal');
const debug = require('debug');


const log = debug('app::test');


async function test(){
    let v = bigInteger('1');
    let elgamal = new ElGamal();

    await elgamal.initializeRemotely(2048);
    
    log(elgamal.generator === elgamal.power(v).toString());
    
    
}


test();