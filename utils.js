const { utils, providers } = require("ethers")
const { Multicall } = require('ethereum-multicall');
const nodeMailer = require("nodemailer");
require('dotenv').config();
const masterPubs = require("./config/pubkey.json")
const slavePubs = require("./config/slavePubKey.json")
const ABI = require("../abi/multicall.json")
const config = require('../config.json');

const provider = new providers.JsonRpcProvider(config.rpc)

const multicallCA = new Multicall({ ethersProvider: provider })

async function get_ms_tvl() {
    const contracts = []
    for (let i = 0; i < slavePubs.length; i++) {
        contracts.push({
            reference: `${i}`,
            contractAddress: config.multicall,
            abi: ABI,
            calls: [{ reference: `${i}`, methodName: 'getEthBalance', methodParameters: [slavePubs[i]] }]
        })
    }

    for (let i = 0; i < masterPubs.length; i++) {
        contracts.push({
            reference: `${i + slavePubs.length}`,
            contractAddress: config.multicall,
            abi: ABI,
            calls: [{ reference: `${i + slavePubs.length}`, methodName: 'getEthBalance', methodParameters: [masterPubs[i]] }]
        })
    }

    const results = await multicallCA.call(contracts);
    let tvl = 0
    for (let i = 0; i < contracts.length; i++) {
        tvl += parseFloat(utils.formatUnits(results.results[i].callsReturnContext[0].returnValues[0], config.nativeDecimal))
    }

    return tvl
}

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

/* Using Hostinger Mail */
const transporter = nodeMailer.createTransport({
    host: "smtp.hostinger.com",
    secure: true,
    secureConnection: false,
    tls: {
        ciphers: "SSLv3",
    },
    requireTLS: true,
    port: 465,
    debug: true,
    connectionTimeout: 10000,
    auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD,
    }
});

const send_email = async (options, callback) => {
    const mailOptions = {
        from: process.env.HOSTINGER_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    return transporter.sendMail(mailOptions).then(info => {
        if (callback)
            callback(null, info.response);
    })
        .catch(err => {
            if (callback)
                callback(err);
        });
};

module.exports = {
    get_ms_tvl,
    send_email,
    delay,
}
