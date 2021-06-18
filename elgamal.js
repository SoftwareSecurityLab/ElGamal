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
        let q = 0;
        do{
            q = await bigIntManager.getPrime(lengthOfOrder-1);
            log(q, typeof q);
            this.p = q.shiftLeft(1).add(1);
            log('one prime number produced:', this.p.bitLength());
        }while(!this.p.isPrime());

        //produce generator:
        do{
            this.g = await bigIntManager.getInRange(this.p,3);
        }while(
            this.g.modPow(q,p).equals(1) ||
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

    async initializeRemotely(lengthOfOrder = 2048){
        return new Promise((resolve, reject)=>{

        https.get(`https://2ton.com.au/getprimes/random/${lengthOfOrder}`, 
                    (res)=>{
                        res.on('data', async (data)=>{
                            let readableData = data.toString('utf8');
                            let primes = JSON.parse(readableData);
                            this.p = bigInteger(primes.p.base10);
                            let q = bigInteger(primes.q.base10);

                            //check Validity of primes:
                            if(q.multiply(2).add(1).compareTo(this.p))
                                reject(`The received primes are not in Safe form:
                                        p = ${primes.p.base10}, 
                                        q = ${primes.q.base10}`);
                            
                            if(!this.p.isProbablePrime())
                                reject('P is not prime: '+ primes.p.base10);
                            if(!q.isProbablePrime())
                                reject('q is not prime: ' + primes.q.base10);

                            //produce generator:
                            do{
                                this.g = await bigIntManager.getInRange(this.p,3);
                            }while(
                                this.g.modPow(q,this.p).equals(1) ||
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
                            resolve(true);
                        })
                    }
        )
        })
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

    /**
     * @param {BigInt} _g Generator
     */
    set generator(_g){
        if(typeof _g === 'string')
            _g = bigInteger(_g);
        this.g = _g;
    }

    get generator(){
        return this.g.toString();
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
        return this.p.toString();
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
        return this.y.toString();
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
        return this.x.toString();
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