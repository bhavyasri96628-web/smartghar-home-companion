
import { useState } from "react";

export default function VoiceBot() {
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState(
    "Hello! I am SmartGhar Voice Assistant."
  );
  const [speaking, setSpeaking] = useState(false);

  const listen = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAnswer("Voice recognition is not supported. Please type your question.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      const question = event.results[0][0].transcript;
      setText(question);
      setAnswer("You said: " + question);
    };
    recognition.onerror = () => {
      setAnswer("Microphone error. Please allow microphone access or type.");
    };
    recognition.start();
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) {
      setAnswer("Voice output is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = "en-IN";
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section style={{
      maxWidth: 600,
      margin: "24px auto",
      padding: 20,
      border: "1px solid #cbd5e1",
      borderRadius: 16,
      fontFamily: "Arial, sans-serif"
    }}>
      <h2>🎙️ SmartGhar Voice Assistant</h2>
      <p>{answer}</p>
      <button onClick={listen}>🎤 Speak</button>
      <div style={{ marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your question..."
          style={{ padding: 10, width: "65%" }}
        />
        <button onClick={() =>
          setAnswer("You asked: " + text)
        }>Ask</button>
      </div>
      <button onClick={speak} style={{ marginTop: 12 }}>
        🔊 {speaking ? "Speaking..." : "Read Answer"}
      </button>
    </section>
  );
}
