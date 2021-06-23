const bigInteger = require('big-integer');
const bigIntManager = require('./bigIntManager');
const debug = require('debug');
const https = require('https');


const log = debug('app::elgamal');


/**
 * @typedef {'HIGH'|'LOW'|'MEDIUM'} securityLevel
 */
const securityLevels = ['HIGH', 'LOW', 'MEDIUM']

class ElGamal{
    /**
     * Initialize the ElGamal Engine by giving private key, public key, modulus, group order, group generator.
     * @param {string|bigInteger} [p] modulus of multiplicative group
     * @param {string|bigInteger} [g] generator of the group
     * @param {string|bigInteger} [y] public key(encryption key), 
     * NOTE: this is not your public key but public key of receiver.
     * @param {string|bigInteger} [x] private key(decryption key)
     * @throws Will throw an error if any of passed parameters is an invalid big integer!
     */
    constructor(p, g, y, x){
        
        /**
         * @property {number} [securityLevel='HIGH']  - determines the security level of the engine.
         * if it's set to 'HIGH' then you should use safe prime numbers as underlying group's modulus,
         * else if it's set to 'MEDIUM' then you should use prime numbers as modulus,
         * else it's set to 'LOW' then there is no condition but on other hands there is no guarantee
         * that the engine operates correctly.
         */
        this.securityLevel = 'HIGH';

        /**
         * @property {boolean} [isSecure=false] - this property indicates whether engine is at expected 
         * secure level or not. If it's false then you will be unable to use the engines functionality.
         * to Change this value to True, please call setSecurityLevel() method.
         */
        this.isSecure = false;

         /**
         * @property {bigInteger} g - The generator of underlying multiplicative group.
         */
        try{
            if(typeof g === 'string')
                this.g = bigInteger(g);
            else if(g instanceof bigInteger)
                this.g = g;
            else
                this.g = undefined;
        }catch(err){
            log('Error when initializing generator:', err);
            throw new Error('Error: generator is not a valid big integer!');
        }
        
        /**
         * @property {bigInteger} p - The modulus of underlying multiplicative group.
         */
        try{
            if(typeof p === 'string'){
                this.p = bigInteger(p);
            }else if(p instanceof bigInteger)
                this.p = p;
            else 
                this.p = undefined;
        }catch(err){
            log('Error when initializing modulus:', err);
            throw new Error('Error: modulus is not a valid big integer');
        }

        /**
         * @property {bigInteger} x - The private key of the ElGamal cryptosystem.
         */
        try{
            if(typeof x === 'string'){
                this.x = bigInteger(x);
            }else if(x instanceof bigInteger)
                this.x = x;
            else
                this.x = undefined;
        }catch(err){
            log('Error when initializing private key: ', err);
            throw new Error(`Private key is not a valid big integer`);
        }

        /**
         * @property {bigInteger} y - The public key of ElGamal encryption
         */
        try{
            if(typeof y === 'string')
                this.y = bigInteger(y);
            else if(y instanceof bigInteger)
                this.y = y;
            else 
                this.y = undefined;
        }catch(err){
            log('Error when initializing public key: ', err);
            throw new Error(`Public key is not a vlid big integer`);
        }

        /**
         * @property {bigInteger} q - The group order
         */
        if(this.p)
            this.q = this.p.minus(1).devide(2);
        
    }

    /**
     * Check the security of engine regarding the configured security level 
     * @returns {boolean} true if the engine is at given security level, otherwise false
     * @throws Will throw an error if the engine is not initialized correctly.
     */
    checkSecurity(){
        if(this.securityLevel === 'HIGH'){
            if(this.q === undefined)
                if(this.p === undefined)
                    throw new Error('Engine is not initialized')
                else
                    this.q = this.p.minus(1).divide(2);
            else if(this.q.multiply(2).add(1).compare(this.p))
                throw new Error('Inconsistent Group Order and Group Modulus');
            
            if(! this.p.isProbablePrime())
                return false;
            else if(! this.q.isProbablePrime())
                return false;
        }else if(this.securityLevel === 'Medium'){
            if(this.p === undefined)
                throw new Error('Engine is not initialized!');
            
            if(! this.p.isProbablePrime())
                return false;
        }else{
            log('Warning: Low level security detected');
            return true;
        }
    }

    /**
     * 
     * @param {securityLevel} level 
     * @throws Will throw an error if level is not one of allowed values
     */
    setSecurityLevel(level){
        if(securityLevels.indexOf(level.toUpperCase()) === -1)
            throw new Error('Invalid security level');
        else
            this.securityLevel = level;
    }

    /**
     * it's better to choose the lengthes which are divided evenly by 8.
     * By calling this method, the engine will create a thread to find a safe prime number and
     * then initialize engine using it.
     * @param {number} lengthOfOrder indicate the length of Modulus of Group in bit
     */
    async initialize(lengthOfOrder = 4096){
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

    /**
     * it's better to choose the lengthes which are divided evenly by 8.
     * This method tries to connect to a remote DB and get the underlying group information and 
     * then initialize the engine.
     * Unlike initialize() method which creates a thread and has an enormous cpu usage, this method
     * don't have any cpu usage but it's need a network connection!
     * @param {number} lengthOfOrder indicate the length of Modulus Of Group in bit
     */
    async initializeRemotely(lengthOfOrder = 4096){
        return new Promise((resolve, reject)=>{

        https.get(`https://2ton.com.au/getprimes/random/${lengthOfOrder}`, 
                    (res)=>{
                        res.on('data', async (data)=>{
                            let readableData = data.toString('utf8');
                            let primes = JSON.parse(readableData);
                            this.p = bigInteger(primes.p.base10);
                            this.q = bigInteger(primes.q.base10);

                            //check Validity of primes:
                            if(this.q.multiply(2).add(1).compareTo(this.p))
                                reject(`The received primes are not in Safe form:
                                        p = ${primes.p.base10}, 
                                        q = ${primes.q.base10}`);
                            
                            if(!this.p.isProbablePrime())
                                reject('P is not prime: '+ primes.p.base10);
                            if(!this.q.isProbablePrime())
                                reject('q is not prime: ' + primes.q.base10);

                            //produce generator:
                            do{
                                let exponent = await bigIntManager.getInRange(this.p,3);
                                this.g = bigInteger[2].modPow(exponent, this.p);
                            }while(
                                this.g.modPow(this.q, this.p).notEquals(1) ||
                                this.g.modPow(2,this.p).equals(1) ||
                                this.p.prev().remainder(this.g).equals(0) ||
                                this.p.prev().remainder(this.g.modInv(this.p)).equals(0)
                            );
                            log('g^q = ', this.g.modPow(this.q, this.p))

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

module.exports = ElGamal;