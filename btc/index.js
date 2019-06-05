const bitcore = require('bitcore-lib');
const https = require('https');
const querystring = require('querystring');
const blockchain = require('blockchain.info');
const blockexplorer = require('blockchain.info/blockexplorer').usingNetwork(3);

var testSend = false;

if (process.argv.indexOf("--send") >= 0)
  testSend = true;

// Use this private keys for testing
const pvKeys = [
  "KzSAwJttccZeCkcL6akGFthCBG5PgQwPQY2YP6vuAWX1tKmwLSnL",
  "KwEHTz121iQe385m57pYwiYYvq7YhVxYqerauiERgtY1Qam6qL97",
  "L33nscBVZuXkQFmFVDYWX5wJksTuJLfNHRZbAFio2dw8ybidsrBk",
  "L3LVKXuDMgKW8yYCKmD951T9WgRgdxshg8iYEzx5FN8uVuLQwwgk",
  "L4XtFC3tdmgkVtpbjnchheGQRefaYxdLxCw8smrkJvMMfd5jwkRC",
  "KxhqzYQwbak3x518dUTDhBUybRYXLq6MWHzfhJK2b5obfLbTxnUw",
  "KxmCS6gocupi6TQXMedbbccWwFfpAcLGwjzJD87e1bpnMytgHnUJ",
  "KzpoWosHW4WDhBE49uG6hRtZcr4WzywrsVNJKt3skvBYsP9mWmaf",
  "KytrYsrB9SmzuYTeGijusBqRijJVnRPnQEfy3P7ZzpmU4oAnQS9a",
  "Ky2YYMktoshWQo4HfZggUMdipQ1SpVc5RFFUZVbZPxsfcjrX35oW"
];
// console.log('Private keys to use (WIF format):', pvKeys);

// Get public key and address from private key
const privateKey = new bitcore.PrivateKey.fromWIF(pvKeys[0]);
const address = bitcore.Address(
  privateKey.toPublicKey(),
  bitcore.Networks.testnet
).toString();
console.log('Main testnet address', address);

// Test message signature
const signature = bitcore.Message('hello, world').sign(privateKey);
const verified = bitcore.Message('hello, world').verify(address, signature);
console.log('Signature', signature, 'from', address, 'is', verified);

// Function to push a raw hexadecimal btc testnet transaction
function sendRawTx(rawTx) {
  return new Promise(function(resolve, reject) {
    const postData = JSON.stringify({
      "hex": rawTx
    });
    const options = {
      hostname: 'testnet-api.smartbit.com.au',
      port: 443,
      path: '/v1/blockchain/pushtx',
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': postData.length
       }
    };
    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        resolve(chunk);
      });
    });
    req.on('error', (e) => {
      reject(e);
    });
    req.write(postData);
    req.end();
  });
}

// Use blockchain.info explorer api to get address balance and txs
blockexplorer.getLatestBlock().then(function(response) {
  console.log('Latest block in testnet', response.height);
  return blockexplorer.getBalance(address);
}).then(function(addressBalance) {
  console.log(address, 'Balance', addressBalance);
  return blockexplorer.getAddress(address);
}).then(function(addressTxs) {
  console.log(address, 'txs', addressTxs.txs.length);

  if (testSend) {

    const toAddress = bitcore.Address(
      bitcore.PrivateKey.fromWIF(pvKeys[1]).toPublicKey(),
      bitcore.Networks.testnet
    ).toString();
    const satoshisToSend = 1000;
    console.log('Sending', satoshisToSend, 'to address', toAddress);

    // Get the unspent outputs of address
    blockexplorer.getUnspentOutputs(address).then(function(unspents) {

      // Parse the unspents to bitcore unspents
      const bitcoreUnspents = unspents.unspent_outputs.map(function(unspent) {
        return new bitcore.Transaction.UnspentOutput({
         "txId" : unspent.tx_hash_big_endian,
         "outputIndex" : unspent.tx_output_n,
         "script" : unspent.script,
         "satoshis" : unspent.value
       });
      });

      // Build transaction
      const transaction = new bitcore.Transaction()
        .from(bitcoreUnspents)          // Feed information about what unspent outputs one can use
        .to(toAddress, satoshisToSend)  // Add an output with the given amount of satoshis
        .change(address)      // Sets up a change address where the rest of the funds will go
        .sign(privateKey)     // Signs all the inputs it can

      console.log('Bitcore transaction:', transaction);
      console.log('Bitcore transaction hex:', transaction.serialize());

      // Push transactions to the network
      sendRawTx(transaction.serialize()).then(function(txSent) {
        console.log('Bitcoin tx sent', txSent)
      })
    });
  }
});
