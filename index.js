const crypto = require('crypto')
const axios = require('axios')
require('dotenv').config()


const fromCoins = ['BTC', 'ETH', 'LTC']
const toCurrency = 'GBP'


const baseUrl = 'https://api.pro.coinbase.com'


const getSignature = (apiSecret, timestamp, method, requestPath, body) => {
    // create the pre-hash string by concatenating required parts
    const preHash = timestamp + method + requestPath + JSON.stringify(body)

    // decode the base64 secret
    const apiSecretBase64 = Buffer.from(apiSecret, 'base64')

    // create a sha256 hmac with the secret
    const hmac = crypto.createHmac('sha256', apiSecretBase64)

    // sign the require message with the hmac and finally base64 encode the result
    const signature = hmac.update(preHash).digest('base64')

    return signature
}

const fetchData = async (requestPath, body, apiKey, apiSecret, timestamp, apiPassphrase) => {
    const method = 'GET'
    const signature = getSignature(apiSecret, timestamp, method, requestPath, body)
    const response = await axios.get(`${baseUrl}${requestPath}`, {
        headers: {
            'CB-ACCESS-KEY': apiKey,
            'CB-ACCESS-SIGN': signature,
            'CB-ACCESS-TIMESTAMP': timestamp,
            'CB-ACCESS-PASSPHRASE': apiPassphrase
        },
        data: body
    })
    return response.data
}

const zip = (arr1, arr2) => arr1.map((k, i) => [k, arr2[i]])

const fetchTickersByCoin = async (fromCoins, toCurrency, apiKey, apiSecret, timestamp, apiPassphrase) => {
    const productIds = fromCoins.map(coin => `${coin}-${toCurrency}`)
    const tickerRequestPaths = productIds.map(productId => `/products/${productId}/ticker`)
    const tickers = await Promise.all(
        tickerRequestPaths.map(path => fetchData(path, { }, apiKey, apiSecret, timestamp, apiPassphrase))
    )
    const entries = new Map(zip(fromCoins, tickers))
    return Object.fromEntries(entries)
}

const getTotalValue = (fromCoins, accounts, tickersByCoin) => {
    const conversionFromCoin = coin => {
        const balance = accounts.find(account => coin == account.currency).balance
        const price = tickersByCoin[coin].price
        return balance * price
    }
    const conversions = fromCoins.map(conversionFromCoin)
    return conversions.reduce((total, amount) => total + amount)
}

const main = async (apiKey, apiSecret, apiPassphrase, fromCoins, toCurrency) => {
    const timestamp = Date.now() / 1000
    const [accounts, tickersByCoin] = await Promise.all([
        fetchData('/accounts', { }, apiKey, apiSecret, timestamp, apiPassphrase),
        fetchTickersByCoin(fromCoins, toCurrency, apiKey, apiSecret, timestamp, apiPassphrase)
    ])
    const totalValue = getTotalValue(fromCoins, accounts, tickersByCoin)
    console.log(`Total value (${toCurrency}): ${totalValue}`)
}

main(
    process.env.API_KEY,
    process.env.API_SECRET,
    process.env.API_PASSPHRASE,
    fromCoins,
    toCurrency
)
.catch(error => console.log)
