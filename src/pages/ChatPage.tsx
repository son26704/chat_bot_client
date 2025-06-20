import { useState, useEffect } from 'react';
import { Button, Card, Input, Typography, message, List, Layout, Menu, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SendOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { sendChatSocket, getConversationHistory, getUserConversations, deleteConversation, getSocket } from '../services/authService';
import type { Message, Conversation, ChatResponse } from '../types/auth';
import ReactMarkdown from 'react-markdown';

const { Title } = Typography;
const { TextArea } = Input;
const { Sider, Content } = Layout;

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStartingNewConversation, setIsStartingNewConversation] = useState(false);

  useEffect(() => {
    fetchConversations();
    const socket = getSocket();
    
    if (socket) {
      socket.on('receive_message', (response: ChatResponse) => {
        if (conversation?.id === response.conversationId) {
          setConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              Messages: [...prev.Messages, response.message]
            };
          });
        }
        setIsTyping(false);
        fetchConversations();
      });

      socket.on('typing', (data: { conversationId: string }) => {
        if (conversation?.id === data.conversationId) {
          setIsTyping(true);
        }
      });
    }

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('receive_message');
        socket.off('typing');
      }
    };
  }, [conversation?.id]);

  const fetchConversations = async () => {
    try {
      const convs = await getUserConversations();
      setConversations(convs);
      if (convs.length > 0 && !conversation && !isStartingNewConversation) {
        fetchConversation(convs[0].id);
      }
      if (isStartingNewConversation) {
        setIsStartingNewConversation(false);
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
    setPrompt('');
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: prompt,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      setConversation(prev => {
        if (!prev) {
          return {
            id: 'temp',
            title: '',
            Messages: [userMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return {
          ...prev,
          Messages: [...prev.Messages, userMessage]
        };
      });

      setIsTyping(true);

      const res = await sendChatSocket({
        prompt,
        conversationId: conversation?.id,
      });

      if (!conversation) {
        await fetchConversations();
      }
    } catch (error) {
      message.error('Failed to send message');
      setIsTyping(false);
    }
  };

  const handleSelectConversation = (convId: string) => {
    fetchConversation(convId);
  };

  const handleNewConversation = () => {
    setConversation(null);
    setPrompt('');
    setIsStartingNewConversation(true);
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setConversations(conversations.filter((conv) => conv.id !== convId));
      if (conversation?.id === convId) {
        setConversation(null);
      }
      message.success('Conversation deleted');
    } catch (error) {
      message.error('Failed to delete conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} theme="light" style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <Title level={4} style={{ padding: '16px', margin: 0 }}>
            Conversations
          </Title>
          <div style={{ padding: '0 16px 16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewConversation}
              block
            >
              New Conversation
            </Button>
          </div>
          <Menu
            mode="inline"
            selectedKeys={conversation ? [conversation.id] : []}
            onClick={({ key }) => handleSelectConversation(key)}
            items={conversations.map((conv) => ({
              key: conv.id,
              label: (
                <div className="conversation-item">
                  <span>{conv.title || `Chat ${conv.createdAt.slice(0, 10)}`}</span>
                  <Popconfirm
                    title="Delete this conversation?"
                    onConfirm={() => handleDeleteConversation(conv.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      className="delete-btn"
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      size="small"
                      onClick={e => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              ),
            }))}
          />
        </div>
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Button 
            type="default" 
            onClick={logout} 
            icon={<LogoutOutlined />}
            block
          >
            Logout
          </Button>
        </div>
      </Sider>
      <Content style={{ padding: '0', background: '#fafafa' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <Title level={3} style={{ margin: 0 }}>Chat with Gemini</Title>
            <p style={{ margin: '8px 0 0' }}>Welcome, {user?.name}!</p>
          </div>
          
          <div className="chat-messages">
            {conversation && (
              <List
                dataSource={conversation.Messages}
                renderItem={(msg: Message) => (
                  <div className={`message-container ${msg.role === 'user' ? 'user' : ''}`}>
                    <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                      {msg.role === 'user' ? (
                        <p style={{ margin: 0 }}>{msg.content}</p>
                      ) : (
                        <div className="markdown-content">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              />
            )}
            {isTyping && (
              <div className="message-container">
                <div className="message-bubble assistant typing">
                  AI is typing...
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <TextArea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift + Enter for new line)"
              style={{ marginBottom: '12px' }}
            />
            <Button 
              type="primary" 
              onClick={handleSend} 
              icon={<SendOutlined />}
              block
            >
              Send
            </Button>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ChatPage;