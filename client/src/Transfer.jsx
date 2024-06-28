import { useState } from "react";
import server from "./server";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, hexToBytes } from "ethereum-cryptography/utils";
import * as secp from  "ethereum-cryptography/secp256k1";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [signedMessage, setSignedMessage] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  function hashMessage(message) {
    return keccak256(utf8ToBytes(message)); 
}

async function signMessage(msg) {
  return await secp.secp256k1.sign(hashMessage(msg), hexToBytes(privateKey));
}

  async function transfer(evt) {
    evt.preventDefault();
    var message = {
      amount: parseInt(sendAmount),
      recipient: recipient
    };
    var signedMessageToHex = await signMessage(JSON.stringify(message));
var signedMessage = signedMessageToHex.toDERHex();
    setSignedMessage(signedMessage);
    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        signedMessage: signedMessage,
        recoveryBit: signedMessageToHex.recovery,
        amount: parseInt(sendAmount),
        recipient
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>
      <div> Signed Transaction: {signedMessage}</div>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
