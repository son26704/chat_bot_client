import { useState } from "react";
import { Button, Card, Input, Typography, message } from "antd";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const { Title } = Typography;
const { TextArea } = Input;

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  type ChatResponse = {
    response: string;
  };

  const handleSend = async () => {
    if (!prompt.trim()) {
      message.error("Please enter a message");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<ChatResponse>("/chat", { prompt });
      setResponse(res.data.response);
      setPrompt("");
    } catch (error) {
      message.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        margin: "20px",
        maxWidth: "800px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Title level={2}>Chat with Gemini</Title>
      <p>Welcome, {user?.name}!</p>
      <TextArea
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your message..."
        style={{ marginBottom: "10px" }}
      />
      <Button type="primary" onClick={handleSend} loading={loading} block>
        Send
      </Button>
      {response && (
        <Card style={{ marginTop: "20px" }}>
          <p>
            <strong>Response:</strong>
          </p>
          <p>{response}</p>
        </Card>
      )}
      <Button
        type="primary"
        danger
        onClick={logout}
        style={{ marginTop: "20px" }}
      >
        Logout
      </Button>
    </Card>
  );
};

export default ChatPage;