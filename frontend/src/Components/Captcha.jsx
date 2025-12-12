import { useEffect, useRef, useState } from "react";

export default function Captcha({ onChange }) {
  const [captchaText, setCaptchaText] = useState("");
  const canvasRef = useRef(null);

  // Function must be inside component to access state/ref
  function generateCaptcha  () {
    const text = Math.random().toString(36).substring(2, 8); // 6 chars
    setCaptchaText(text);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "30px Arial";
      ctx.fillText(text, 20, 35);
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <canvas
        ref={canvasRef}
        width="150"
        height="50"
        style={{ border: "1px solid gray" }}
      ></canvas>

      <input
        type="text"
        placeholder="Enter CAPTCHA"
        onChange={(e) => onChange(e.target.value, captchaText)}
      />

      <button type="button" onClick={generateCaptcha}>
        Refresh CAPTCHA
      </button>
    </div>
  );
}
