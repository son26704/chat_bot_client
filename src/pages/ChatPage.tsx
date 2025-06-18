import { useState, useEffect } from 'react';
import { Button, Card, Input, Typography, message, List, Layout, Menu } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { sendChat, getConversationHistory, getUserConversations } from '../services/authService';
import type { Message, Conversation } from '../types/auth';

const { Title } = Typography;
const { TextArea } = Input;
const { Sider, Content } = Layout;

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const convs = await getUserConversations();
      setConversations(convs);
      if (convs.length > 0 && !conversation) {
        fetchConversation(convs[0].id);
      }
    } catch (error) {
      message.error('Failed to load conversations');
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const conv = await getConversationHistory(conversationId);
      setConversation(conv);
    } catch (error) {
      message.error('Failed to load conversation');
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) {
      message.error('Please enter a message');
      return;
    }
    setLoading(true);
    try {
      const res = await sendChat({
        prompt,
        conversationId: conversation?.id,
      });
      setPrompt('');
      await fetchConversation(res.conversationId);
      await fetchConversations();
    } catch (error) {
      message.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (convId: string) => {
    fetchConversation(convId);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="light">
        <Title level={4} style={{ padding: '16px' }}>
          Conversations
        </Title>
        <Menu
          mode="inline"
          selectedKeys={conversation ? [conversation.id] : []}
          onClick={({ key }) => handleSelectConversation(key)}
        >
          {conversations.map((conv) => (
            <Menu.Item key={conv.id}>
              {conv.title || `Chat ${conv.createdAt.slice(0, 10)}`}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Content style={{ padding: '20px' }}>
        <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2}>Chat with Gemini</Title>
          <p>Welcome, {user?.name}!</p>
          {conversation && (
            <List
              dataSource={conversation.Messages}
              renderItem={(msg: Message) => (
                <List.Item style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <Card style={{ maxWidth: '70%', background: msg.role === 'user' ? '#e6f7ff' : '#f6ffed' }}>
                    <p><strong>{msg.role === 'user' ? 'You' : 'Gemini'}:</strong> {msg.content}</p>
                  </Card>
                </List.Item>
              )}
              style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}
            />
          )}
          <TextArea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message..."
            style={{ marginBottom: '10px' }}
          />
          <Button type="primary" onClick={handleSend} loading={loading} block>
            Send
          </Button>
          <Button type="primary" danger onClick={logout} style={{ marginTop: '20px' }}>
            Logout
          </Button>
        </Card>
      </Content>
    </Layout>
  );
};

export default ChatPage;