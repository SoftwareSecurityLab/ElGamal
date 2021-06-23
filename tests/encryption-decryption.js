const ElGamal = require('../elgamal');
const debug = require('debug');

const log = debug('app::test')

async function test(){
    const elgamal = new ElGamal();

    log('Initialize the engine remotely...');
    await elgamal.initializeRemotely();
    let securityStatus = elgamal.checkSecurity();
    if(! securityStatus){
        log('Error: Engine is not secure.');
        return;
    }

    let message = await elgamal.randomGropuMember();

    log(`length of selected message is ${message.bitLength()} and
        the original message is: ${message}`);
    
    log('Encrypting message...');
    let cipherPair = await elgamal.encrypt(message);

    log('Resulted cipher text:', cipherPair);

    log('Decrypting cipher text...');
    let decryptedMessage = await elgamal.decrypt(cipherPair);

    log(`length of decrypted message is ${decryptedMessage.bitLength()} and
        the decrypted decryptedMessage is: ${message}`);


    log(`\n\n========> Test Result: ${message.equals(decryptedMessage)} <========`);
    
}

test();