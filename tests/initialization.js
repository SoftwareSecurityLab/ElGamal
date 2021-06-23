const ElGamal = require('../elgamal');


async function test() {
    const elgamal = new ElGamal();
    await elgamal.initializeRemotely();
}


test();