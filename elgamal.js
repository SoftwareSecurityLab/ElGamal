/**
 * ElGamal Module
 * @module basic_simple_elgamal
 */


const bigInteger = require('big-integer');
const bigIntManager = require('./bigIntManager');
const debug = require('debug');
const https = require('https');


const log = debug('app::elgamal');
const securityLevels = ['HIGH', 'LOW', 'MEDIUM']


/**
 * @typedef {'HIGH'|'LOW'|'MEDIUM'} securityLevel
 */
/**
 * @typedef {Object} cipherText (refer to ElGamal Schema for more information).
 * @property {bigInteger.BigInteger} c1 - This is half the shared secret: c1 = g^r 
 * @property {bigInteger.BigInteger} c2 - This is encrypted message: c2 = y^r . m
 */
/**
 * @typedef {8192|4096|3072|2048} allowedLengthes
 */
/**
 * @typedef {Object} Engine the object containing essential information to build the ElGamal
 *  cryptoengine again
 * @property {bigInteger.BigInteger} p - The modulus of underlying group and determine the whole Cyclic group
 * @property {bigInteger.BigInteger} g - The generator of underlying group.
 * @property {bigInteger.BigInteger} y - The public key which is your public key and others can use it to 
 * encrypt messages for you.
 * @property {bigInteger.BigInteger} [x] - The private key(decryption key) which is strongly recommended to don't export it
 * @property {bigInteger.BigInteger} [r] - The secret key which is used in last encryption to build 
 * the cipherText.c1
 * @property {securityLevel} [security] - The engine security level.
 */


class ElGamal{

    /**
     * Initialize the ElGamal Engine by giving private key, public key, modulus, group order, group generator.
     * @param {string|bigInteger.BigInteger} [p] modulus of multiplicative group
     * @param {string|bigInteger.BigInteger} [g] generator of the group
     * @param {string|bigInteger.BigInteger} [y] public key(encryption key), 
     * NOTE: this is not your public key but public key of receiver.
     * @param {string|bigInteger.BigInteger} [x] private key(decryption key)
     * @throws Will throw an error if any of passed parameters is an invalid big integer!
     */
    constructor(p, g, y, x){
        
        /**
         * @property {securityLevel} [securityLevel='HIGH']  - determines the security level of the engine.
         * if it's set to 'HIGH' then you should use safe prime numbers as underlying group's modulus,
         * else if it's set to 'MEDIUM' then you should use prime numbers as modulus,
         * else it's set to 'LOW' then there is no condition but on other hands there is no guarantee
         * that the engine operates correctly.
         * @type {securityLevel}
         */
        this.securityLevel = 'HIGH';

        /**
         * @property {boolean} [isSecure=false] - this property indicates whether engine is at expected 
         * secure level or not. If it's false then you will be unable to use the engines functionality.
         * to Change this value to True, please call setSecurityLevel() method.
         */
        this.isSecure = false;

         /**
         * @property {bigInteger.BigInteger} g - The generator of underlying multiplicative group.
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
         * @property {bigInteger.BigInteger} p - The modulus of underlying multiplicative group.
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
         * @property {bigInteger.BigInteger} x - The private key of the ElGamal cryptosystem.
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
         * @property {bigInteger.BigInteger} y - The public key of ElGamal encryption
         * @private
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
         * @property {bigInteger.BigInteger} q - The group order
         */
        if(this.p)
            this.q = this.p.minus(1).divide(2);
        
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
        }else if(this.securityLevel === 'MEDIUM'){
            if(this.p === undefined)
                throw new Error('Engine is not initialized!');
            
            if(! this.p.isProbablePrime())
                return false;
        }else
            log('Warning: Low level security detected');
        
        this.isSecure = true;
        return true;
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
     * @async
     * @param {number} lengthOfOrder indicate the length of Modulus of Group in bit
     */
    async initialize(lengthOfOrder = 4096){
        let q = undefined;
        do{
            q = await bigIntManager.getPrime(lengthOfOrder-1);
            log(q, typeof q);
            this.p = q.shiftLeft(1).add(1);
            log('one prime number produced:', this.p.bitLength());
        }while(!this.p.isPrime());

        //produce generator:
        do{
            let exponent = await bigIntManager.getInRange(this.p,3);
            this.g = bigInteger[2].modPow(exponent, this.p);
        }while(
            this.g.modPow(q,this.p).notEquals(1) ||
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
     * This method tries to connect to a remote DB and get the underlying group information 
     * then initialize the engine.
     * Unlike initialize() method which creates a thread and has an enormous cpu usage, this method
     * don't have any cpu usage but it's need a network connection!
     * @async
     * @param {allowedLengthes} lengthOfOrder indicate the length of Modulus Of Group in bit
     * @throws Will throw an error if there is no internet connection or received Information are
     * inconsistent.
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


    /**
     * Encrypt the given message under ElGamal cryptosystem schema. By default this use your own 
     * public key unless you change it by setting publicKey.
     * @param {number|bigInteger.BigInteger} message - The message which you want to encrypt it. please note due to the ElGamal schema
     * it's must be a member of underlying group.
     * @returns {Promise<cipherText>} - The resulted cipher text which you can decrypt it by using decrypt() method. 
     * @throws Will throw an Error if the message is not a number
     */
    async encrypt(message){

        if(! this.isSecure){
            throw new Error(`Engine is not secure to use, 
                please make sure you call checkSecurity() method before using engine.`);
        }

        if(! this.isReady()){
            throw new Error(`Engine is not initialized correctly!`);
        }

        const tempPrivateKey = await bigIntManager.getInRange(this.p.prev(), 1);

        /**
         * @property {bigInteger.BigInteger} lastEncryptionKey keeps the last used encryption key.
         */
        this.lastEncryptionKey = tempPrivateKey;

        let msgBI;
        if(typeof message === 'string'){
            throw new Error('Not implemented yet! the message should of type number');
        }else if(typeof message === 'number')
            msgBI = bigInteger(message);
        else if(message instanceof bigInteger)
            msgBI = message;
        else
            throw new Error('Not supported message type');
        
        log(this.y.modPow(tempPrivateKey, this.p).toString());
        return {
            c1 : this.g.modPow(tempPrivateKey, this.p),
            c2 : this.y.modPow(tempPrivateKey, this.p).multiply(msgBI).remainder(this.p)
        };
    }

    /**
     * 
     * @param {cipherText} cipherPair - The result of encrypt() method. 
     * @returns {Promise<bigInteger.BigInteger>} - The decrypted message which is a big Integer. The message is a member of 
     * underlying Cyclic Group.
     */
    async decrypt(cipherPair){

        if(! this.isSecure){
            throw new Error(`Engine is not secure to use, 
                please make sure you call checkSecurity() method before using engine.`);
        }

        if(! this.isReady()){
            throw new Error(`Engine is not initialized correctly!`);
        }

        const sharedSecret = cipherPair.c1.modPow(this.x, this.p);
        const reverseSecret = sharedSecret.modInv(this.p);
        const plainText = reverseSecret.multiply(cipherPair.c2).mod(this.p);
        return plainText;
    }

    /**
     * Choose one of the underlying group members randomly!
     * @returns {Promise<bigInteger.BigInteger>} One of group members which is selected randomly.
     */
    async randomGropuMember(){
        let exponenet = await bigIntManager.getInRange(this.p, 3);
        return this.g.modPow(exponenet, this.p);
    }

    /**
     * calculate: generator^exponent mod modulus. It  works independent of ElGamal, it means you
     * can use it even if ElGamal fails security conditions.
     * This method is not part of elgamal but part of basic group functionality! it's provided
     * here to reduce the complexity of dependencies.
     * @param {bigInteger.BigInteger|string} exponent - The exponent to calculate its modular exponentiation 
     * regarding generator
     * @returns {bigInteger.BigInteger} The resulted modular exponentiation
     */
    power(exponent){
        if(typeof exponent === 'string')
            exponent = bigInteger(exponent);
        return this.g.modPow(exponent, this.p);
    }

    /**
     * calculate: a + b mod modulus. It works independent of ElGamal, it means you can use it 
     * even if ElGamal fails security conditions.
     * This method is not part of elgamal but part of basic group functionality! it's provided
     * here to reduce the complexity of dependencies.
     * @param {bigInteger.BigInteger|string} a - The first number.
     * @param {bigInteger.BigInteger|string} b - The second number to be added with a.
     * @returns {bigInteger.BigInteger} - The resulted modular addition.
     */
    add(a, b){
        if(typeof a === 'string')
            a = bigInteger(a);
        if(typeof b === 'string')
            b = bigInteger(b);

        return a.add(b).mod(this.p);
    }

    /**
     * calculate: a * b mod modulus. It works independent of ElGamal, it means you can use it 
     * even if ElGamal fails security conditions.
     * This method is not part of elgamal but part of basic group functionality! it's provided
     * here to reduce the complexity of dependencies.
     * @param {bigInteger.BigInteger|string} a - The first number
     * @param {bigInteger.BigInteger|string} b - The second number to be multiplying in a
     * @returns {bigInteger.BigInteger} - The resulted modular multiplication.
     */
    multiply(a, b){
        if(typeof a === 'string')
            a = bigInteger(a);
        if(typeof b === 'string')
            b = bigInteger(b);

        return a.multiply(b).mod(this.p);
    }

    /**
     * @param {bigInteger.BigInteger|string} _g Generator
     */
    set generator(_g){
        if(typeof _g === 'string')
            _g = bigInteger(_g);
        this.g = _g;
    }

    /**
     * @type {string}
     */
    get generator(){
        return this.g.toString();
    }

    /**
     * @param {bigInteger.BigInteger|string} _q Order of inner cyclic group
     */
    set groupOrder(_q){
        if(typeof _q === 'string')
            _q = bigInteger(_q);
        this.q = _q;
    }

    /**
     * @type {string}
     */
    get groupOrder(){
        return this.q.toString();
    }

    /**
     * @param {bigInteger.BigInteger|string} _p Modulus of Multiplicative group
     */
    set modulus(_p){
        if(typeof _p === 'string')
            _p = bigInteger(_p);
        this.p = _p;
    }

    /**
     * @type {string}
     */
    get modulus(){
        return this.p.toString();
    }
    

    /**
     * This is not ElGamal public key but the public secret.
     * @param {bigInteger.BigInteger|string} _y public key
     */
    set publicKey(_y){
        if(typeof _y === 'string')
            _y = bigInteger(_y);
        this.y = _y;
    }

    /**
     * @type {string}
     */
    get publicKey(){
        return this.y.toString();
    }

    /**
     * We strongly advise to avoid calling this method!
     * @param {bigInteger.BigInteger|string} _x private key
     *
     */
    set privateKey(_x){
        if(typeof _x === 'string')
            _x = bigInteger(_x);
        this.x = _x;
    }

    /**
     * Will return the private key if and only if the securityLevel is 'LOW'.
     * We strongly advise to avoid calling this method, 
     *  because this method return the flat private key and not 
     *  ElGamal private key
     * @type {string?}
     * @throws Will throw an Error if securityLevel is not 'LOW'
     */
    get privateKey(){
        if(this.securityLevel === 'LOW')
            return this.x.toString();
        else
            throw new Error('Violating security policies. First set the security level to \'LOW\'');
    }

    /**
     * This method checks if engine is initialized or not. It doesn't check engine security.
     * @returns {boolean} - True if all parameters of engine are available and false otherwise.
     */
    isReady(){
        if(this.p && this.g && this.y && this.x){
            return true;
        }
        return false;
    }

    /**
     * This method will export the ElGamal engine so that you can build it again completely.
     * @param {boolean} deep if true then some last secret key will be revealed and removed from
     * ElGamal for security sake.
     * @returns {Engine} The exported ElGamal engine, you can import it easily by calling import() method
     */
    export(deep){
        let r = undefined;
        if(deep){
            r = this.lastEncryptionKey;
            this.lastEncryptionKey = undefined;
        }
        return {
            r,
            security: this.securityLevel,
            ...(this.securityLevel === 'LOW'? {x: this.x} : undefined),
            g: this.g,
            p: this.p,
            y: this.g.modPow(this.x, this.p)
        };
    }

    /**
     * This method will import ElGamal engine based on passed info.
     * @param {Engine} engine - The ElGamal info which is exported using export() method.
     */
    import(engine){
        this.isSecure = false;
        this.g = engine.g;
        this.p = engine.p;
        this.y = engine.p;
        this.securityLevel = engine.security;
        this.x = engine.x;
    }
}



/**
 * ElGamal Engine
 */
module.exports = ElGamal;