const { utils, providers } = require("ethers")
const { Multicall } = require('ethereum-multicall');
require('dotenv').config();
const ABI = require("./abi.json")
const list = require('./watch_list');

const multicall = '0xcA11bde05977b3631167028862bE2a173976CA11'

async function main() {
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
                const amount = parseFloat(utils.formatUnits(results.results[j].callsReturnContext[0].returnValues[0], list[i].target[j].decimals)).toFixed(3)
                console.log(`   ${amount} ${list[i].target[j].name}`)
            }
        } catch (error) { }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });