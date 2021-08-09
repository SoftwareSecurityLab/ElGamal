- [ElGamal](#elgamal)
- [Installation](#installation)
- [Usage](#usage)
  - [Quick start](#quick-start)
    - [Encryption](#encryption)
    - [Decryption](#decryption)
  - [Methods](#methods)
    - [`ElGamal([p], [g], [y], [x])`](#elgamalp-g-y-x)
    - [`setSecurityLevel(level)`](#setsecuritylevellevel)
    - [`checkSecurity()`](#checksecurity)
    - [`initialize([lengthOfOrder])`](#initializelengthoforder)
    - [`initializeRemotely([lengthOfOrder])`](#initializeremotelylengthoforder)
    - [`fillIn()`](#fillin)
    - [`encrypt(message)`](#encryptmessage)
    - [`decrypt(cypherPair)`](#decryptcypherpair)
    - [`randomGroupMember()`](#randomgroupmember)
    - [`export(deep)`](#exportdeep)
    - [`import(engine)`](#importengine)
    - [`power(exponent)`](#powerexponent)
    - [`add(a, b)`](#adda-b)
    - [`multiply(a, b)`](#multiplya-b)
  - [Properties](#properties)
- [Example](#example)
- [Contributing](#contributing)
- [Support](#support)
- [Authors and acknowledgment](#authors-and-acknowledgment)
- [License](#license)

# ElGamal

This module is an implementation of [ElGamal][eg] Encryption System in Javascript which is secured regarding the last security suggestions.

As the name of the package suggests, we are trying to keep this module simple and basic! Hence we are trying to develop this module according to original [ElGamal][eg]:

* The engine works over [Cyclic Groups][cg] of Integers
* In safest mode, The underlying Cyclic Group is a [Multiplicative Group][mg] of  a large prime number order
* Security of engine depends on security of [Discrete Logarithms][dl] problem.

**NOTE:** The Module is developed for educational goals, although we developed it securely but the risk of using it in production environment is on you!

# Installation

Either you are using [Node.js][nj] or a browser, you can use it locally by downloading it from [npm][np]: 
```
npm install basic_simple_elgamal
```

# Usage

To include this module in your code simply:
```
const ElGamal = require('basic_simple_elgamal');
```

If you are using it in a browser, you may need to use a tool such as [browserify][by] to compile your code.

## Quick start 

After including the module into your code:

1. Get an instance of ElGamal:

    ```
    const elgamal = new ElGamal();
    ```

2. Initialize your instance:
    ```
    //2048 is the key length.
    await elgamal.initializeRemotely(2048);
    ```
3. Make sure your engine is secure:
    ```
    elgamal.checkSecurity();
    ```
    Now your engine is ready to use.

### Encryption

Since engine works over [Cyclics Groups][cg], at first **you should map your messages into group members**!

This mapping doesn't have any confidentially value and you can publish it publicly. Hence to keep the flexibility of engine, we don't offer any strict way for mapping the messages but you can use any algorithm on your choice.

To get the group members, you can call [`randomGroupMember()`](#randomgroupmember) method!

Assume you have a message `m` and  you want to encrypt it:

1. Map this message to a group member:
    ```
        const mappedM = elgamal.randomGroupMember();
    ```
2. Encrypt the message:
   ```
    let ciphertext = elgamal.encrypt(mappedM);
   ```

   And you're done.

### Decryption

Having the resulted cyphertext, you can decrypt it as below:
```
    let decryptedMessage = elgamal.decrypt(cipherText);
```
The `decryptedMessage` is the original group member which you encrypted, so to get the original message, you should apply your mapping to it!

## Methods

All methods which you may need are documented here. If a method is not documented, it means it is an internal method and you shouldn't call it directly.

While introducing the methods, we use specific Terms which are listed below:
* **Throws Error:** Indicates the methods throw an error, the type or reason of possible errors is explained in the method's explanation.
* **Async:** Indicates this method is an asynchronous method which means you should wait for it to complete its execution
* **Secure:** Before calling these methods you need to call the [`checkSecurity()`](#checksecurity) and get `true` as return value.

### `ElGamal([p], [g], [y], [x])`

* **`p`:** The modulus of multiplicative group.
* **`g`:** The generator of cyclic group.
* **`y`:** The encryption key.
* **`x`:** The decryption key.
* **Return:** An instance of engine.
* **Throws Error**

These parameters are large integers.  
All four parameters should be of type string or [`big-integer`][bi] otherwise it will be initialized with `undefined` or will throw an error.

The modulus `p` can be prime or not considering engine's security level.

The modulus `p` and generator `g` are required for defining the cyclic group, the encryption key `y` and decryption key `x` are required for [ElGama Encryption][eg]. So providing `x` and `y` without `p` and `g` is meaningless.   
Hence you can provide `p` and `g`, then call [`fillIn()`](#fillin) method to let engine pick the values `y` and `x` automatically.

Although the engine gives you this option to initialize it manually but **we strongly recommend to use [`initialize()`](#initialize) or [`initializeRemotely()`](#initializeRemotely) instead of using constructor!**

### `setSecurityLevel(level)`
* **`level`:** Is level of security.
* **Returns:** void
* **Throws Error**

level is one of the following strings: `'HIGH'`, `'LOW'`, `'MEDIUM'`. if you pass another value except this three values, you will encounter an error.

**By default the security level is `'HIGH'` and it is strongly recommended to don't change it.**
>**More Info:**
>
>At `'HIGH'` security level: The underlying [Cyclic Group][cg] is made using  [Safe and Sophie Germain primes][ssgp].
>
>At `'MEDIUM'` security level: The modulus of group is a prime number. **We don't recomend this level because initializing engine at this level requires high cpu usage.**
>
> At `'LOW'` security level: There is no limitation over engine but also **there is no guarantee that engine will works correctly.**

### `checkSecurity()`
* **Returns:** boolean

This method checks the ElGamal engine against the *security level* and if it satisfies the conditions then it will returns true and activates the engine otherwise it will returns false and don't let you to use secure methods.

### `initialize([lengthOfOrder])`
* **`lengthOfOrder`**: The length of underlying group order in bits.
* **Returns:** void
* **Async**

**This method requires high cpu usage** because it tries to initialize the engine locally. Also **it uses multithreading** to do its job.

As mentioned above, this method requires high cpu usage and because of that we recommend to use [initializeRemotely()](#initializeremotelylengthoforder) instead. **This method just developed to enable engine to work independently** in case of no network connection.

`lengthOfOrder` parameter is an arbitrary integer but we recommend to pass a value larger than 2048. Also by default its value is 2048.

### `initializeRemotely([lengthOfOrder])`
* **`lengthOfOrder`**: The length of underlying group order in bits.
* **Returns:** void
* **Async**

Initialize the engine by connecting to a remote databas hence it requires a network connection to do its job.

The information received from remote Database are public and you don't need to worry about its security. Also we verify the received information to make sure there is no midway manipulation.

`lengthOfOrder` parameter indicates length of group order and can be one of the following values: `2048`, `3072`, `4096` and `8192`.

> **More Info:** After initializing the engine either by using [constructor](#elgamalp-g-y-x), [`initialize()`](#initializelengthoforder) or [`initializeRemotely()`](#initializeremotelylengthoforder), the encryption key is equal to your public key! You can set the correct encryption key by setting the [publicKey](#properties) as mentioned in [Properties](#properties) section.


### `fillIn()`
* **Returns:** void

If you just have the group information(which are modulus `p` and group order `g`) and you want to use this group in ElGamal encryption, you can call this method to set the private key and its corresponding public key.

**NOTE:** You don't need to call this method if you use [`initialize()`](#initializelengthoforder) or [`initializeRemotely()`](#initializeremotelylengthoforder)
methods. This is useful only if you use [constructor](#elgamalp-g-y-x) without private/public key to initialize the engine.

### `encrypt(message)`
* **`message`:** A group member which represents your message.
* **Returns:** An object containing a pair of cyphertexts.
* **Async**
* **Throws Error**
* **Secure**

Encrypts your passed message and returns the corresponding cyphertext.

`message` parameter should be a member of underlying [Cyclic Group][cg]. We don't check for its membership but yourself should care about it.

Throws an error if you didn't call [`checkSecurity()`](#checksecurity) method or it returns false which means the engine doesn't satisfy the considered security level. Also it throws an error if provided information is not complete(in case of initializing engine manually by calling [constructor](#elgamalp-g-y-x)).
   
>**More Info:**
The resulting cyphertext is an object containing two below properties:
>
>1. c1: Shared secret.
>2. c2: Encrypted message.


### `decrypt(cypherPair)`
* **`cypherPair`:** same resulted cyphertext from [`encrypt()`](#encryptmessage) method
* **Returns:** The decrypted message which is an integer and a member of [Cyclic Group][cg]
* **Async**
* **Secure**
* **Throws Error**
  
Decrypts the given cyphertext and returns corresponding plaintext.

Throws an error if you didn't call [`checkSecurity()`](#checksecurity) method or it returns false which means the engine doesn't satisfy the considered security level. Also it throws an error if provided information is not complete (in case of initializing engine manually by calling [constructor](#elgamalp-g-y-x)).

### `randomGroupMember()`
* **Returns:** [`big-integer`][bi]
* **Async**

Returns a group member randomly.  
You can use this function to make your customized mapping between messages and group members.

This method is cryptographically secure so don't hesitate to use it.

### `export(deep)`
* **deep:** boolean
* **Returns:** The exported engine.

Exports engine as an object then you can import it again using [`import()`](#importengine)

`deep` parameters inidicates whether you want the whole engine to be experted or just public info of it.  
Set `deep` as true result in exporting your random keys as well as other info. (You can read more about random key at [ElGamal][eg]).

**Note:** Your private key will be exported if and only if your security level is at `'LOW'`.  
So if you need your private key, **which is not recommended but you may need for your need**, you should first use [setSecurityLevel()](#setsecuritylevellevel) to decrease the security level. 

By using this method you are enable to export and transfer your engine.

### `import(engine)`
* **`engine`:** The resulted object from calling [`export()`] method.
* **Returns:** void

Imports ElGamal engine so that you can use it again.

**NOTE:** You may need to call [`checkSecurity()`](#checksecurity) to activate *secure* methods.



### `power(exponent)`
* **`exponent`:** Is exponenet of power operation.
* **Returns:** [`big-integer`][bi]

Computes modular exponentiation with generator `g` as base of exponentiation.

All parameters are of `string` type or [`big-integer`][bi] type.

> This method is not part of elgamal but it is a part of Cyclic group calculations, its provided just to fullfill your other common needs.
 
### `add(a, b)`
* **`a`:** The first operand.
* **`b`:** The second operand.
* **Returns:** [big-integer][bi]

Calculates `(a + b) mod p` and returns the result.

All parameters are of `string` type or [`big-integer`][bi] type.

> This method is not part of elgamal but it is a part of Modular calculations. Its provided just to fullfill your other common needs.
 
### `multiply(a, b)`
* **`a`:** The first operand.
* **`b`:** The second operand.
* **Returns:** [big-integer][bi]

Calculates `(a.b) mod p` and returns the result.

All parameters are of `string` type or [`big-integer`][bi] type.

> This method is not part of elgamal but it is a part of Modular calculations. Its provided just to fullfill your other common needs.


## Properties
You can get or set these properties as you wish:

1. generator
2. groupOrder
3. modulus
4. publicKey
5. PrivateKey \*

\* **Using these properties is not secure and is not recommended as well. Also setting these properties will work if and only if the security level is at `'LOW'`**

# Example
A simple example is provided at [`./tests/encryption-decryption.js`][exmpage] file which is available at [GitHub page][gitpage] too.

# Contributing
Since this module is developed at [Software Security Lab][softsl], you can pull requests but merging it depends on [Software Security Lab][softsl] decision.  
Also you can open issues first then we can discuss about it.

# Support
If you need help you can either open an issue in [GitHub page][gitpage] or contact the developers by mailing to golgolniamilad@gmail.com

# Authors and acknowledgment
I'm so grateful to [Dr.Maryam Mouzarani][tmail] who was directing this project fully from guidance to contribution.

In simple words:
> If there wasn't her helps and guidances it was impossible to develop this module.

# License
This work is published under [ISC][isc] license.



[eg]: https://en.wikipedia.org/wiki/ElGamal_encryption
[np]: https://www.npmjs.com/
[nj]: https://nodejs.org/en/
[by]: https://browserify.org/
[cg]: https://en.wikipedia.org/wiki/Cyclic_group
[mg]: https://en.wikipedia.org/wiki/Multiplicative_group
[dl]: https://en.wikipedia.org/wiki/Discrete_logarithm
[bi]: https://www.npmjs.com/package/big-integer
[ssgp]: https://en.wikipedia.org/wiki/Safe_and_Sophie_Germain_primes

[gitpage]: https://

[exmpage]: ./tests/encryption-decryption.js
[softsl]: https://github.com/SoftwareSecurityLab
[tmail]: mailto:maryam.mouzarani@gmail.com
[isc]: ./LICENSE