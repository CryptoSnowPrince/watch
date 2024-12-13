const { utils, providers } = require("ethers")
const { Multicall } = require('ethereum-multicall');
require('dotenv').config();
const ABI = require("./abi.json")
const list = require('./watch_list');

const multicall = '0xcA11bde05977b3631167028862bE2a173976CA11'

async function main() {
    let sum = 0;
    let ethSum = 0;
    let bnbSum = 0;
    let usdSum = 0;
    let item = [];
    for (let i = 0; i < list.length; i++) {
        try {
            console.log(`${list[i].name}(${list[i].account}) on ${list[i].chain}`)
            const provider = new providers.JsonRpcProvider(list[i].rpc)
            const multicallCA = new Multicall({ ethersProvider: provider })
            const contracts = []
            for (let j = 0; j < list[i].target.length; j++) {
                contracts.push({
                    reference: `${j}`,
                    abi: ABI,
                    contractAddress: list[i].target[j].name === list[i].target[j].address ? multicall : list[i].target[j].address,
                    calls: [{
                        reference: `${j}`,
                        methodName: list[i].target[j].name === list[i].target[j].address ? 'getEthBalance' : 'balanceOf',
                        methodParameters: [list[i].account]
                    }]
                })
            }
            const results = await multicallCA.call(contracts);
            for (let j = 0; j < list[i].target.length; j++) {
                const amount = parseFloat(utils.formatUnits(results.results[j].callsReturnContext[0].returnValues[0], list[i].target[j].decimals))
                if (list[i].target[j].name.includes('ETH')) {
                    ethSum += amount;
                }
                if (list[i].target[j].name.includes('BNB')) {
                    bnbSum += amount;
                }
                if (list[i].target[j].name.includes('USD')) {
                    usdSum += amount;
                }
                if (list[i]?.mark) {
                    sum += amount;
                    item.push(amount.toFixed(3))
                }
                console.log(`   ${amount.toFixed(3)} ${list[i].target[j].name}`)
            }
        } catch (error) { }
    }
    let validStr = `Valid   ${sum.toFixed(3)} ETH (`
    for(let i = 0; i < item.length; i++) {
        if(i === 0) {
            validStr = `${validStr}${item[i]}`
        } else {
            validStr = `${validStr}, ${item[i]}`
        }
    }
    validStr = `${validStr})`
    console.log(validStr)
    console.log(`total ETH:   ${ethSum.toFixed(3)} ETH`)
    console.log(`total BNB:   ${bnbSum.toFixed(3)} BNB`)
    console.log(`total USD:   ${usdSum.toFixed(1)} USD`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });