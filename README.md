# Coinbase Wrapper - Node.js

## Setup

### Environment

Run

```bash
cp .env.example .env
```

then edit the `.env` file with your Coinbase API key data.

### Node project

```bash
npm i
```

### Parameters

Edit the following values in `index.js` with your desired ones.

```javascript
const fromCoins = ['BTC', 'ETH', 'LTC']
const toCurrency = 'GBP'
```

## Execute

```bash
npm start
```