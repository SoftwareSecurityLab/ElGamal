const bigInteger = require('big-integer');
const bigIntManager = require('./bigIntManager');
const debug = require('debug');
const https = require('https');


const log = debug('app::elgamal');


class ElGamal{
    
    constructor(){
        this.p = 0;      //safe prime number:: order of group
        this.g = 0;      //generator of group.
        this.y = 0;      //public Key
        this.x = 0;      //private Key
    }

    /**
     * it's better to choose the lengthes which are divided evenly by 8
     * @param {number} lengthOfOrder indicate the length of Order Of Group in bit
     */
    async initialize(lengthOfOrder = 2048){
        //BUG:we're ignoring q! so if there was any problem with cryptoSystem, 
        //    we should come back here and fix it
        do{
            this.p = await bigIntManager.getPrime(lengthOfOrder);
            log('one prime number produced:', this.p.bitLength());
        }while(this.p.bitLength() != lengthOfOrder);

        //produce generator:
        do{
            this.g = await bigIntManager.getInRange(this.p,3);
        }while(
            this.g.modPow(2,this.p).equals(1) ||
            this.p.prev().remainder(this.g).equals(0) ||
            this.p.prev().remainder(this.g.modInv(this.p)).equals(0)
        );

        //produce privateKey:
        this.x = await bigIntManager.getInRange(
            this.p.prev(),
            2
        );

        //calculate public key:
        this.y = this.g.modPow(this.x, this.p);
    }

    async encrypt(message){
        const tempPrivateKey = await bigIntManager.getInRange(this.p.prev(), 1);

        let msgBI;
        if(typeof message === 'string'){
            log(`This module is not intended to support string encryption types 
                    but we try our best to do it.`);
            msgBI = bigInteger(Buffer(message).toString('hex'), 16);
        }else if(typeof message === 'number')
            msgBI = bigInteger(message);
        else
            throw new Error('Not supported message type');
        
        log(this.y.modPow(tempPrivateKey, this.p).toString());
        return {
            c1 : this.g.modPow(tempPrivateKey, this.p),
            c2 : this.y.modPow(tempPrivateKey, this.p).multiply(msgBI).remainder(this.p)
        };
    }

    async decrypt(cypherPair){
        const sharedSecret = cypherPair.c1.modPow(this.x, this.p);
        const reverseSecret = sharedSecret.modInv(this.p);
        const plainText = reverseSecret.multiply(cypherPair.c2).mod(this.p);
        return plainText.toString();
    }

    async randomGropuMember(){
        return (await bigIntManager.getInRange(this.p, 3));
    }

    async fillOut(){
        if(!this.p)
            //Not Implemented yet.
            throw new Error('Service is not Implemented');
        if(!this.g)
            //Not Implemented yet.
            throw new Error('Service is not Implemented');
        if(!this.x)
            this.x = await bigIntManager.getInRange(
                this.p.prev(),
                2
            );
        if(!this.y)
            this.y = this.g.modPow(this.x, this.p);
    }

    async power(base, exponent){
        if(typeof base === 'string')
            base = bigInteger(base);
        if(typeof exponent === 'string')
            exponent = bigInteger(exponent);
        return (await base.modPow(exponent, this.p));
    }

    async add(first, second){
        if(typeof first === 'string')
            first = bigInteger(first);
        if(typeof second === 'string')
            second = bigInteger(second);
        return (await first.add(second).mod(this.p));
    }

    async simpleAdd(first, second){
        if(typeof first === 'string')
            first = bigInteger(first);
        if(typeof second === 'string')
            second = bigInteger(second);
        return (await first.add(second));
    }

    async multiply(first, second){
        if(typeof first === 'string')
            first = bigInteger(first);
        if(typeof second === 'string')
            second = bigInteger(second);
        return (await first.multiply(second).mod(this.p));
    }

    /**
     * @param {BigInt} _g Generator
     */
    set generator(_g){
        if(typeof _g === 'string')
            _g = bigInteger(_g);
        this.g = _g;
    }

    get generator(){
        return this.g;
    }

    /**
     * @param {BigInt} _p Order of inner cyclic group
     */
    set groupOrder(_p){
        if(typeof _p === 'string')
            _p = bigInteger(_p);
        this.p = _p;
    }

    get groupOrder(){
        return this.p;
    }

    /**
     * This is not ElGamal public key but the public secret.
     * @param {BigInt} _y public key
     */
    set publicKey(_y){
        if(typeof _y === 'string')
            _y = bigInteger(_y);
        this.y = _y;
    }

    get publicKey(){
        return this.y;
    }

    /**
     * We strongly advise to avoid calling this method!
     * @param {BigInt} _x private key
     */
    set privateKey(_x){
        if(typeof _x === 'string')
            _x = bigInteger(_x);
        this.x = _x;
    }

    /**
     * We strongly advise to avoid calling this method, 
     *  because this method return the flat private key and not 
     *  ElGamal private key
     */
    get privateKey(){
        return this.x;
    }

    isReady(){
        if(this.p && this.g && this.y && this.x){
            return true;
        }
        return false;
    }
}


const instance = new ElGamal();

module.exports = instance;