import { useState, useEffect } from "react";
import { Button, Card, Input, Typography, message, List } from "antd";
import { useAuth } from "../hooks/useAuth";
import { sendChat, getConversationHistory } from "../services/authService";
import type { Message, Conversation } from "../types/auth";

const { Title } = Typography;
const { TextArea } = Input;

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) {
      message.error("Please enter a message");
      return;
    }
    setLoading(true);
    try {
      const res = await sendChat({
        prompt,
        conversationId: conversation?.id,
      });
      setPrompt("");
      // Thêm delay nhỏ để đảm bảo database commit
      setTimeout(() => fetchConversation(res.conversationId), 500);
    } catch (error) {
      message.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const conv = await getConversationHistory(conversationId);
      setConversation(conv);
    } catch (error: any) {
      message.error(`Failed to load conversation: ${error.message}`);
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
      {conversation && (
        <List
          dataSource={conversation.Messages}
          renderItem={(msg: Message) => (
            <List.Item
              style={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Card
                style={{
                  maxWidth: "70%",
                  background: msg.role === "user" ? "#e6f7ff" : "#f6ffed",
                }}
              >
                <p>
                  <strong>{msg.role === "user" ? "You" : "Gemini"}:</strong>{" "}
                  {msg.content}
                </p>
              </Card>
            </List.Item>
          )}
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            marginBottom: "20px",
          }}
        />
      )}
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
