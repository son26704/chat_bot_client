import { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Typography,
  message,
  List,
  Layout,
  Menu,
  Popconfirm,
  Modal,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  LogoutOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CopyOutlined,
  BulbOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import {
  sendChatSocket,
  getConversationHistory,
  getUserConversations,
  deleteConversation,
  getSocket,
  renameConversation,
  deleteMessage,
  editMessage,
  getFollowUpQuestions,
} from "../services/authService";
import UserProfileModal from "./UserProfileModal";
import type { Message, Conversation, ChatResponse } from "../types/auth";
import ReactMarkdown from "react-markdown";

const { Title } = Typography;
const { TextArea } = Input;
const { Sider, Content } = Layout;

const ChatPage = () => {
  const { user, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStartingNewConversation, setIsStartingNewConversation] =
    useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchConversations();
    const socket = getSocket();

    if (socket) {
      socket.on("receive_message", (response: ChatResponse) => {
        if (
          (conversation && conversation.id === response.conversationId) ||
          (conversation?.id === "temp" && response.conversationId)
        ) {
          setConversation((prev) => {
            if (!prev) return null;

            const newMessages =
              prev.id === "temp"
                ? [prev.Messages[0], response.message]
                : [...prev.Messages, response.message];

            return {
              ...prev,
              id: response.conversationId,
              Messages: newMessages,
            };
          });
          fetchConversations();
        }
        setIsTyping(false);
      });

      socket.on("typing", (data: { conversationId: string }) => {
        if (
          conversation?.id === data.conversationId ||
          conversation?.id === "temp"
        ) {
          setIsTyping(true);
        }
      });
    }

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("receive_message");
        socket.off("typing");
      }
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.Messages.length, isTyping]);

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
      message.error("Failed to load conversations");
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const conv = await getConversationHistory(conversationId);
      setConversation(conv);
    } catch (error) {
      message.error("Failed to load conversation");
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) {
      message.error("Please enter a message");
      return;
    }
    setPrompt("");
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: prompt,
        role: "user",
        createdAt: new Date().toISOString(),
      };

      const currentConversation = conversation;

      setConversation((prev) => {
        if (!prev) {
          return {
            id: "temp",
            title: "",
            Messages: [userMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return {
          ...prev,
          Messages: [...prev.Messages, userMessage],
        };
      });

      setIsTyping(true);

      await sendChatSocket({
        prompt,
        conversationId:
          currentConversation?.id === "temp"
            ? undefined
            : currentConversation?.id,
      });
      await fetchConversations();
    } catch (error) {
      message.error("Failed to send message");
      setIsTyping(false);
    }
  };

  const handleSelectConversation = (convId: string) => {
    fetchConversation(convId);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = () => {
    setConversation(null);
    setPrompt("");
    setIsStartingNewConversation(true);
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setConversations(conversations.filter((conv) => conv.id !== convId));
      if (conversation?.id === convId) {
        setConversation(null);
      }
      message.success("Conversation deleted");
    } catch (error) {
      message.error("Failed to delete conversation");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRenameConversation = async (convId: string) => {
    if (!renameValue.trim()) {
      message.error("Title cannot be empty");
      return;
    }
    try {
      await renameConversation(convId, renameValue.trim());
      setConversations((conversations) =>
        conversations.map((conv) =>
          conv.id === convId ? { ...conv, title: renameValue.trim() } : conv
        )
      );
      if (conversation?.id === convId) {
        setConversation({ ...conversation, title: renameValue.trim() });
      }
      setRenamingId(null);
      setRenameValue("");

      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }

      message.success("Conversation renamed");
    } catch (error) {
      message.error("Failed to rename conversation");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success("Copied!");
  };

  const handleDeleteMessage = async (msg: Message) => {
    try {
      await deleteMessage(msg.id);
      if (conversation) await fetchConversation(conversation.id);
      await fetchConversations();
      message.success("Message deleted");
    } catch (err) {
      message.error("Failed to delete message");
    }
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.content);
  };

  const handleEditConfirm = async (msg: Message) => {
    try {
      await editMessage(msg.id, editValue);
      setEditingMessageId(null);
      setEditValue("");
      if (conversation) await fetchConversation(conversation.id);
      await fetchConversations(); // Thêm dòng này để cập nhật lại danh sách sidebar
      message.success("Message edited and resent");
    } catch (err) {
      message.error("Failed to edit message");
    }
  };

  const handleGetSuggestions = async () => {
    if (!conversation?.id) {
      message.error("No conversation selected");
      return;
    }

    setLoadingSuggestions(true);
    try {
      const data = await getFollowUpQuestions(conversation.id);
      // Xử lý nếu data.suggestions là JSON string bọc markdown
      const clean = data.suggestions.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.suggestions)) {
        setSuggestions(parsed.suggestions);
        setShowSuggestions(true);
      } else {
        throw new Error("Invalid suggestions");
      }
    } catch (err) {
      message.error("Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sider
        width={280}
        theme="light"
        className={`${sidebarOpen ? "open" : ""} ${
          !sidebarOpen ? "hidden-desktop" : ""
        }`}
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <Title level={4} style={{ padding: "16px", margin: 0 }}>
            Conversations
          </Title>
          <div style={{ padding: "0 16px 16px" }}>
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
                  {renamingId === conv.id ? (
                    <>
                      <Input
                        size="small"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => setRenamingId(null)}
                        onPressEnter={() => handleRenameConversation(conv.id)}
                        style={{ width: "70%" }}
                        maxLength={50}
                      />
                      <Button
                        type="text"
                        icon={<SendOutlined />}
                        size="small"
                        onMouseDown={(e) => {
                          e.stopPropagation(); // tránh click vào menu item
                          handleRenameConversation(conv.id);
                        }}
                        style={{ marginLeft: 4 }}
                      />
                    </>
                  ) : (
                    <>
                      <span>
                        {conv.title || `Chat ${conv.createdAt.slice(0, 10)}`}
                      </span>
                      <Button
                        className="edit-btn"
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(conv.id);
                          setRenameValue(conv.title || "");
                        }}
                        style={{ marginLeft: 4 }}
                      />
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
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </>
                  )}
                </div>
              ),
            }))}
          />
        </div>
        <div
          style={{
            marginTop: "auto",
            padding: "16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Button
            type="default"
            onClick={logout}
            icon={<LogoutOutlined />}
            block
          >
            Logout
          </Button>
          <Button
            type="default"
            onClick={() => setShowProfileModal(true)}
            icon={<EditOutlined />}
            block
            style={{ marginTop: 8 }}
          >
            Hồ sơ người dùng
          </Button>
        </div>
      </Sider>

      {/* Toggle Button */}
      <Button
        className="sidebar-toggle-btn"
        style={{
          position: "fixed",
          top: 16,
          left: sidebarOpen ? 290 : 16,
          zIndex: 210,
        }}
        icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <Content
        style={{ padding: 0, background: "#fafafa", position: "relative" }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 20,
              background: "#fff",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Chat with Gemini
            </Title>
            <p style={{ margin: "8px 0 0" }}>Welcome, {user?.name}!</p>
          </div>

          <div className="chat-messages">
            {conversation && (
              <List
                dataSource={conversation.Messages}
                renderItem={(msg: Message, idx) => (
                  <div
                    className={`message-container ${
                      msg.role === "user" ? "user" : ""
                    }`}
                  >
                    <div
                      className={`message-bubble ${
                        msg.role === "user" ? "user" : "assistant"
                      }`}
                      style={{ position: "relative" }}
                    >
                      {editingMessageId === msg.id ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <Input.TextArea
                            value={editValue}
                            autoSize
                            autoFocus
                            onChange={(e) => setEditValue(e.target.value)}
                            onPressEnter={(e) => {
                              if (!e.shiftKey) {
                                e.preventDefault();
                                setDeletingMessageId(msg.id);
                              }
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignSelf: "flex-end",
                            }}
                          >
                            <Popconfirm
                              title="Edit this message? (All below will be deleted and resent)"
                              onConfirm={() => handleEditConfirm(msg)}
                              onCancel={() => setEditingMessageId(null)}
                              okText="Yes"
                              cancelText="No"
                              open={deletingMessageId === msg.id}
                              onOpenChange={(open) => {
                                if (!open) setDeletingMessageId(null);
                              }}
                            >
                              <Button
                                type="primary"
                                icon={<SendOutlined />}
                                size="middle"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                onClick={() => setDeletingMessageId(msg.id)}
                              >
                                Send
                              </Button>
                            </Popconfirm>
                            <Button
                              type="default"
                              size="middle"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditValue("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : msg.role === "user" ? (
                        <>
                          <p style={{ margin: 0 }}>{msg.content}</p>
                          <div className="message-actions">
                            <Button
                              icon={<CopyOutlined />}
                              size="small"
                              onClick={() => handleCopy(msg.content)}
                            />
                            <Button
                              icon={<EditOutlined />}
                              size="small"
                              onClick={() => handleEditMessage(msg)}
                            />
                            <Popconfirm
                              title="Delete this message and all below?"
                              onConfirm={() => handleDeleteMessage(msg)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                icon={<DeleteOutlined />}
                                danger
                                size="small"
                              />
                            </Popconfirm>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="markdown-content">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          <div className="message-actions">
                            <Button
                              icon={<CopyOutlined />}
                              size="small"
                              onClick={() => handleCopy(msg.content)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              />
            )}
            {isTyping && (
              <div className="message-container">
                <div className="message-bubble assistant typing">
                  <div className="typing-dots">
                    AI is typing<span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container input-with-icons">
            <TextArea
              rows={4} // tăng chiều cao
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập câu hỏi... (Enter để gửi, Shift + Enter để xuống dòng)"
            />
            <div className="chat-action-buttons">
              <Button
                icon={<SendOutlined />}
                type="primary"
                shape="circle"
                onClick={handleSend}
              />
              <Button
                icon={<BulbOutlined />}
                shape="circle"
                style={{
                  backgroundColor: "#fff7e6",
                  border: "1px solid #faad14",
                  color: "#fa8c16",
                }}
                onClick={handleGetSuggestions}
              />
            </div>
          </div>
        </div>
        {showSuggestions && (
          <div className="suggestions-box">
            <div className="suggestions-header">
              <span>💡 Gợi ý câu hỏi tiếp theo</span>
              <Button
                type="text"
                size="small"
                onClick={() => setShowSuggestions(false)}
                style={{ float: "right" }}
              >
                ✕
              </Button>
            </div>
            {loadingSuggestions ? (
              <Spin />
            ) : (
              <List
                size="small"
                dataSource={suggestions}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: "4px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                    actions={[
                      <Button
                        type="link"
                        icon={<CopyOutlined />}
                        size="small"
                        onClick={() => {
                          setPrompt(item);
                          message.success("Đã chèn vào ô nhập");
                        }}
                      >
                        Copy
                      </Button>,
                    ]}
                  >
                    {item}
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      </Content>
    </Layout>
  );
};

export default ChatPage;
