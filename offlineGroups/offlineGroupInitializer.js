const debug = require('debug')
const https = require('https')
const fs = require('fs/promises')

const log = debug('app::Offline Initializer')

async function initializeRemotely(lengthOfOrder = 4096){
    return new Promise((resolve, reject)=>{

    https.get(`https://2ton.com.au/getprimes/random/${lengthOfOrder}`, 
                (res)=>{
                    res.on('data', async (data)=>{
                        let readableData = data.toString('utf8');
                        let primes = JSON.parse(readableData);
                        let p = primes.p.base10
                        let q = primes.q.base10

                        resolve({p, q});
                    })
                }
    )
    })
}


async function main(){
    //Dump 100 unique groups of 2048 order:
    let waitToWriteAllFiles = [];
    let checkUniqueness = []
    for(let i = 0; i < 100; i++){
        let file = await fs.open(`./2048/${i}.js`, 'w');

        let {
            p, q
        } = await initializeRemotely(2048);
        if(checkUniqueness[`${p}${q}`] == 1){
            i--;
            continue;
        }else
            checkUniqueness[`${p}${q}`] = 1;

        let content = `module.exports = { p: '${p}', q: '${q}'}`;
        waitToWriteAllFiles.push(
            file.writeFile(content)
        );
        log(`the ${i}'th 2048-bit group created.`)
    }

    //Dump 100 unique groups of 3072 order:
    checkUniqueness = [];
    for(let i = 0; i < 100; i++){
        let file = await fs.open(`./3072/${i}.js`, 'w');

        let {
            p, q
        } = await initializeRemotely(3072);
        if(checkUniqueness[`${p}${q}`] == 1){
            i--;
            continue;
        }else
            checkUniqueness[`${p}${q}`] = 1;

        let content = `module.exports = { p: '${p}', q: '${q}'}`;
        waitToWriteAllFiles.push(
            file.writeFile(content)
        );
        log(`the ${i}'th 3072-bit group created.`)
    }

    //Dump 100 unique groups of 4096 order:
    checkUniqueness = [];
    for(let i = 0; i < 100; i++){
        let file = await fs.open(`./4096/${i}.js`, 'w');

        let {
            p, q
        } = await initializeRemotely(4096);
        if(checkUniqueness[`${p}${q}`] == 1){
            i--;
            continue;
        }else
            checkUniqueness[`${p}${q}`] = 1;

        let content = `module.exports = { p: '${p}', q: '${q}'}`;
        waitToWriteAllFiles.push(
            file.writeFile(content)
        );
        log(`the ${i}'th 4096-bit group created.`)
    }
    

    //Dump 100 uinque groups of 8192 order:
    checkUniqueness = [];
    for(let i = 0; i < 100; i++){
        let file = await fs.open(`./8192/${i}.js`, 'w');

        let {
            p, q
        } = await initializeRemotely(8192);
        if(checkUniqueness[`${p}${q}`] == 1){
            i--;
            continue;
        }else
            checkUniqueness[`${p}${q}`] = 1;

        let content = `module.exports = { p: '${p}', q: '${q}'}`;
        waitToWriteAllFiles.push(
            file.writeFile(content)
        );
        log(`the ${i}'th 8192-bit group created.`)
    }


    await Promise.all(waitToWriteAllFiles)
}


main();