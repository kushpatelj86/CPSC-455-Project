import React, { useState, useRef, useEffect } from "react";

function hexToBytes(hex) {
  const result = [];
  for (let i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return new Uint8Array(result);
}

// Fetch external key
async function fetchKey() {
  const res = await fetch('/aes-key.pem');
  if (!res.ok) {
    throw new Error("Failed to fetch key");
  }
  const hex = (await res.text()).trim();
  const keyBytes = hexToBytes(hex);
  if (keyBytes.length !== 32) {
    throw new Error("Invalid key length (expected 32 bytes)");
  }
  return keyBytes;
}

const SYMMETRIC_KEY = fetchKey();

async function importAesGcmKey(rawKey) {
  return await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, true, ["decrypt"]);
}

async function decrypt(encryptedObject) {
  const ivBytes = hexToBytes(encryptedObject.iv);
  const ctBytes = hexToBytes(encryptedObject.ciphertext);
  const tagBytes = hexToBytes(encryptedObject.authTag);
  const combined = new Uint8Array([...ctBytes, ...tagBytes]);

  const keyBytes = await SYMMETRIC_KEY;
  const key = await importAesGcmKey(keyBytes);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes, tagLength: 128 },
      key,
      combined
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    return "[Failed to decrypt]";
  }
}

export function Chat() {
  const storedUser = localStorage.getItem("currentUser");
  let currentUser = null;

  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }

  const ws = useRef(null);
  const [messages, setMessages] = useState([]);
  const [sender] = useState(currentUser.username);
  const [receiver, setReceiver] = useState("All");
  const [msgInput, setMsgInput] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");

  const msgBoxRef = useRef();


  // Auto-scroll
  useEffect(() => {
    msgBoxRef.current?.scrollTo(0, msgBoxRef.current.scrollHeight);
  }, [messages]);

  // join chat event
  function joinChat() {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: "join",
        username: sender
      })
    );
  }

  // WebSocket setup
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000");

    ws.current.onopen = () => {
      console.log("WebSocket connected.");
      joinChat();
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      const username = data.username || "System";
      const rawMsg = data.message;

      let decrypted;

      if (typeof rawMsg === "object") {
        decrypted = await decrypt(rawMsg);
      } 
      else {
        decrypted = rawMsg;
      }

      setMessages((prev) => [
        ...prev,
        {
          username,
          message: decrypted,
          type: data.type
        }
      ]);
    };

    return () => {
      ws.current && ws.current.close();
    };
  }, []);

  // Send message
  function sendMessage(receiver, message) {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN){ 
      return;
    }
    ws.current.send(
      JSON.stringify({
        type: "message",
        username: sender,
        receiver,
        message
      })
    );
  }

  function handleSend() {
    if (!msgInput.trim()) {
      return;
    }

    const finalMsg = msgInput + selectedEmoji;
    sendMessage(receiver, finalMsg);

    setMsgInput("");
    setSelectedEmoji("");
  }

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div id="chatBox" style={{ display: "block" }}>
        <h2>
          Welcome, <span>{sender}</span>
        </h2>

        <input
          type="text"
          placeholder="Receiver (All or username)"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
        />

        <select
          value={selectedEmoji}
          onChange={(e) => setSelectedEmoji(e.target.value)}
        >
          <option value="">Select emoji</option>
          <option value="😀">😀 Joy</option>
          <option value="😢">😢 Sadness</option>
          <option value="😡">😡 Anger</option>
          <option value="😱">😱 Fear</option>
          <option value="🤢">🤢 Disgust</option>
        </select>

        <input
          type="text"
          placeholder="Type your message"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button onClick={handleSend}>Send</button>

        <div
          id="messages"
          ref={msgBoxRef}
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #ccc",
            marginTop: "10px",
            padding: "5px",
            color: "white"
          }}
        >
          {messages.map((msg, idx) => {
            const isSender = msg.username === sender;
            return (
              <div
                key={idx}
                className={isSender ? "msg msg-sender" : "msg msg-receiver"}
              >
                <strong>
                  {isSender ? `${msg.username} (You)` : msg.username}
                </strong>
                : {msg.message}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
