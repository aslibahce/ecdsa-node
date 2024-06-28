const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const { keccak256 } = require("ethereum-cryptography/keccak");
const secp = require("ethereum-cryptography/secp256k1");
const { utf8ToBytes, toHex , toRawBytes} = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "033e94d52fe848a6ff0c80cc6e343c676b5481d1915164256cbd60fc4e1ed7e814": 100,
  "03043cdd4606d361de335833696a8f5ba74db5ac40703c143bdd732718a2ca4066": 50,
  "03002e818116ec83199f6c2ed45ca2c87cfd526ce8b084c554d387a7dafcec1dc4": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {

  //TODO: get a signature from the client side app
  //recover the public address from the sign

  const { signedMessage, recoveryBit, recipient, amount } = req.body;  

  var message = {
    amount: amount,
    recipient: recipient
  };
  var hashedMessage = keccak256(utf8ToBytes(JSON.stringify(message)));
  const { r, s, recovery } = secp.secp256k1.Signature.fromDER(signedMessage).addRecoveryBit(recoveryBit);
  const sig = new secp.secp256k1.Signature(BigInt(r), BigInt(s), recovery);
  const calculatedPublicKey = sig.recoverPublicKey(hashedMessage).toRawBytes();

  if (!secp.secp256k1.verify(signedMessage, hashedMessage, calculatedPublicKey)) {
    res.status(400).send({ message: "Invalid message sign!" });
  }

  var sender = toHex(calculatedPublicKey);

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}


