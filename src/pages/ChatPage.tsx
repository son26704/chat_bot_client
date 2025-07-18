// client/src/pages/ChatPage.tsx
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
  FileSearchOutlined,
  PaperClipOutlined,
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
  getSuggestedProfileFromMessage,
  getSuggestedProfileFromConversation,
  getUserProfile,
} from "../services/authService";
import UserProfileModal from "./UserProfileModal";
import UserProfileSuggestModal from "./UserProfileSuggestModal";
import type { Message, Conversation, ChatResponse } from "../types/auth";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import CodeBlock from "../components/CodeBlock";

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
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestedProfileData, setSuggestedProfileData] = useState<Record<
    string,
    string
  > | null>(null);
  const [useProfileContext, setUseProfileContext] = useState(true);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const [memoryWorthyMsgIds, setMemoryWorthyMsgIds] = useState<Set<string>>(
    new Set()
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

            const updatedMessages = [...prev.Messages];

            const lastMsgIndex = updatedMessages.findIndex(
              (msg) => msg.id === response.userMessage.id
            );
            if (lastMsgIndex !== -1) {
              updatedMessages[lastMsgIndex] = response.userMessage;
            }

            // Thêm assistantMessage vào
            updatedMessages.push(response.assistantMessage);

            return {
              ...prev,
              id: response.conversationId,
              Messages: updatedMessages,
            };
          });

          if (response.memoryWorthyUserMessageId) {
            setMemoryWorthyMsgIds((prev) => {
              const newSet = new Set(prev);
              newSet.add(response.memoryWorthyUserMessageId!);
              return newSet;
            });
          }
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

  useEffect(() => {
    if (showSuggestions) {
      const timeout = setTimeout(() => {
        setShowSuggestions(false);
      }, 20000); // 20 giây

      return () => clearTimeout(timeout);
    }
  }, [showSuggestions]);

  const fetchConversation = async (conversationId: string) => {
    try {
      const conv = await getConversationHistory(conversationId);
      setConversation(conv);
      if (conv.Messages && conv.Messages.length > 0) {
        setHasSentFirstMessage(true);
      }
    } catch (error) {
      message.error("Failed to load conversation");
    }
  };

  const handleSend = async () => {
  if (!prompt.trim()) {
    message.error("Please enter a message");
    return;
  }
  if (!hasSentFirstMessage) setHasSentFirstMessage(true);
  
  // Tạo userMessage ngay lập tức cho cả hai trường hợp
  const userMessage: Message = {
    id: Date.now().toString(),
    content: prompt, // Chỉ chứa prompt gốc, không format với file đính kèm
    role: "user",
    createdAt: new Date().toISOString(),
    attachments: attachments.length > 0 ? attachments.map(f => f.name) : [],
  };

  // Thêm userMessage vào state ngay lập tức
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

  setPrompt("");
  setAttachments([]);
  
  try {
    let systemPrompt: string | undefined = undefined;
    if (useProfileContext) {
      try {
        const res = await getUserProfile();
        const profileJson = JSON.stringify(res, null, 2);
        systemPrompt = `Thông tin hồ sơ người dùng:\n${profileJson}\n---\nDùng thông tin này để hiểu rõ người dùng hơn`;
      } catch (err) {
        console.warn("Không thể lấy hồ sơ người dùng", err);
      }
    }

    setIsTyping(true);

    if (attachments.length > 0) {
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (conversation?.id && conversation?.id !== "temp") {
        formData.append("conversationId", conversation.id);
      }
      if (systemPrompt) formData.append("systemPrompt", systemPrompt);
      attachments.forEach((file) => {
        formData.append("files", file);
      });
      const API_URL = import.meta.env.VITE_API_URL;

      const { data: response } = await axios.post<ChatResponse>(
        `${API_URL}/chat`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      // Cập nhật conversation với response từ server
      setConversation((prev) => {
        if (!prev) {
          return {
            id: response.conversationId,
            title: "",
            Messages: [response.userMessage, response.assistantMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        
        const updatedMessages = [...prev.Messages];
        // Thay thế userMessage tạm thời bằng userMessage từ server
        if (updatedMessages.length > 0) {
          updatedMessages[updatedMessages.length - 1] = response.userMessage;
        }
        updatedMessages.push(response.assistantMessage);
        
        return {
          ...prev,
          id: response.conversationId,
          Messages: updatedMessages,
        };
      });

      if (response.memoryWorthyUserMessageId) {
        setMemoryWorthyMsgIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(response.memoryWorthyUserMessageId!);
          return newSet;
        });
      }
    } else {
      // Tin nhắn thường sử dụng socket
      await sendChatSocket({
        prompt,
        conversationId:
          conversation?.id === "temp" ? undefined : conversation?.id,
        ...(systemPrompt ? { systemPrompt } : {}),
      });
    }
    
    setIsTyping(false);
    await fetchConversations();
  } catch (error) {
    message.error("Failed to send message");
    setIsTyping(false);
  }
};

  const handleSelectConversation = (convId: string) => {
    fetchConversation(convId);
    setShowSuggestions(false);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = () => {
    setConversation(null);
    setPrompt("");
    setIsStartingNewConversation(true);
    setHasSentFirstMessage(false);
    setUseProfileContext(true);
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
      await fetchConversations();
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

  const handleSuggestFromMessage = async (messageId: string) => {
    try {
      const data = await getSuggestedProfileFromMessage(messageId);
      setSuggestedProfileData(data);
      setShowSuggestModal(true);
    } catch (error) {
      message.error("Không thể gợi ý từ tin nhắn");
    }
  };

  const handleSuggestFromConversation = async () => {
    if (!conversation?.id) {
      console.warn("⚠️ No conversation selected");
      return;
    }
    try {
      const data = await getSuggestedProfileFromConversation(conversation.id);
      setSuggestedProfileData(data);
      setShowSuggestModal(true);
    } catch (error) {
      console.error("❌ Error in handleSuggestFromConversation:", error);
      message.error("Không thể gợi ý từ cuộc trò chuyện");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const files = Array.from(e.target.files || []);
    const maxFiles = 2;
    const maxSize = 1024 * 1024; // 1MB
    // Kiểm tra tổng số file
    if (files.length + attachments.length > maxFiles) {
      setFileError("Chỉ được gửi tối đa 2 file!");
      return;
    }
    // Kiểm tra trùng file (name + size)
    for (const file of files) {
      if (file.size > maxSize) {
        setFileError(`File ${file.name} vượt quá 1MB!`);
        return;
      }
      if (attachments.some(f => f.name === file.name && f.size === file.size) || files.filter(f => f.name === file.name && f.size === file.size).length > 1) {
        setFileError(`File ${file.name} đã được chọn!`);
        return;
      }
    }
    setAttachments((prev) => [...prev, ...files].slice(0, maxFiles));
    e.target.value = ""; // reset input để chọn lại file cũ nếu cần
  };

  const handleRemoveFile = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
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
          <Button
            type="default"
            onClick={handleSuggestFromConversation}
            icon={<FileSearchOutlined />}
            block
            style={{ marginTop: 8 }}
          >
            Gợi ý từ hội thoại
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
                renderItem={(msg: Message) => {
                  const isMemoryWorthy = memoryWorthyMsgIds.has(msg.id);

                  return (
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
                            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                              {msg.content}
                            </p>
                            {/* Hiển thị file đính kèm dưới bubble */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: "8px 12px",
                                  background: "#e6f7ff",
                                  borderRadius: 8,
                                  border: "1px solid #91d5ff",
                                  fontSize: "13px",
                                  maxWidth: 320,
                                }}
                              >
                                <strong>📎 File đính kèm:</strong>
                                <ul
                                  style={{
                                    paddingLeft: 20,
                                    marginTop: 4,
                                    marginBottom: 0,
                                  }}
                                >
                                  {msg.attachments.map((file, idx) => (
                                    <li key={idx}>{file}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
                              <Button
                                icon={<FileSearchOutlined />}
                                size="small"
                                onClick={() => handleSuggestFromMessage(msg.id)}
                                title="Gợi ý cập nhật hồ sơ"
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
                              <ReactMarkdown
                                components={{
                                  code({
                                    node,
                                    inline,
                                    className,
                                    children,
                                    ...props
                                  }: any) {
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    return !inline ? (
                                      <CodeBlock
                                        language={match?.[1] || ""}
                                        value={String(children).replace(
                                          /\n$/,
                                          ""
                                        )}
                                      />
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
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

                      {/* ✅ Suggestion outside bubble */}
                      {isMemoryWorthy && (
                        <div
                          style={{
                            fontStyle: "italic",
                            fontSize: "13px",
                            color: "#888",
                            marginTop: 6,
                            marginLeft: msg.role === "user" ? 16 : 48,
                          }}
                        >
                          Cập nhật thông tin người dùng?
                          <Button
                            size="small"
                            type="link"
                            onClick={() => {
                              handleSuggestFromMessage(msg.id);
                              setMemoryWorthyMsgIds((prev) => {
                                const updated = new Set(prev);
                                updated.delete(msg.id);
                                return updated;
                              });
                            }}
                          >
                            ✔️
                          </Button>
                          <Button
                            size="small"
                            type="link"
                            danger
                            onClick={() =>
                              setMemoryWorthyMsgIds((prev) => {
                                const updated = new Set(prev);
                                updated.delete(msg.id);
                                return updated;
                              })
                            }
                          >
                            ❌
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }}
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

          {!hasSentFirstMessage && (
            <div className="start-mode-container">
              <Typography.Text
                strong
                style={{ display: "block", marginBottom: 8 }}
              >
                🎯 Chế độ bắt đầu hội thoại:
              </Typography.Text>
              <div className="start-mode-row">
                <Button
                  type={useProfileContext ? "primary" : "default"}
                  onClick={() => setUseProfileContext(true)}
                >
                  Dùng User Profile
                </Button>
                <Button
                  type={!useProfileContext ? "primary" : "default"}
                  onClick={() => setUseProfileContext(false)}
                >
                  Không dùng Profile
                </Button>
                <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
                  {useProfileContext
                    ? "AI sẽ dùng hồ sơ người dùng để hiểu bạn rõ hơn"
                    : "AI sẽ không dùng hồ sơ, chỉ phản hồi theo câu hỏi hiện tại"}
                </Typography.Text>
              </div>
            </div>
          )}

          <div className="chat-input-container input-with-icons" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            {/* Hiển thị file đính kèm phía trên TextArea */}
            {attachments.length > 0 && (
              <div style={{
                marginBottom: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                width: "100%",
                alignItems: "center",
              }}>
                {attachments.map((file, idx) => (
                  <div key={idx} style={{
                    background: "#f5f5f5",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    padding: "4px 12px 4px 8px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    gap: 4,
                    color: "#595959",
                    maxWidth: 180,
                  }}>
                    <PaperClipOutlined style={{ marginRight: 4, color: "#bfbfbf" }} />
                    <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleRemoveFile(idx)}
                      style={{ marginLeft: 4 }}
                    />
                  </div>
                ))}
              </div>
            )}
            {fileError && (
              <div style={{ color: "#ff4d4f", marginBottom: 8, fontSize: 13 }}>{fileError}</div>
            )}
            <div style={{ position: "relative", width: "100%" }}>
              <TextArea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập câu hỏi... (Enter để gửi, Shift + Enter để xuống dòng)"
                style={{ width: "100%", minWidth: 0, paddingRight: 120 }}
              />
              <div className="chat-action-buttons" style={{
                position: "absolute",
                right: 16,
                bottom: 16,
                display: "flex",
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                zIndex: 2,
              }}>
                {/* Nút upload file custom */}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button
                  icon={<PaperClipOutlined />}
                  shape="circle"
                  style={{
                    background: "#fff",
                    border: "1px solid #b7eb8f",
                    color: "#52c41a",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 2}
                  title="Đính kèm file (tối đa 2 file, mỗi file <= 1MB)"
                />
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
        <UserProfileSuggestModal
          visible={showSuggestModal}
          onClose={() => {
            setShowSuggestModal(false);
            setSuggestedProfileData(null);
          }}
          data={suggestedProfileData}
        />
      </Content>
    </Layout>
  );
};

export default ChatPage;
