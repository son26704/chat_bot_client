// client/src/components/SearchWebModal.tsx
import React, { useState } from "react";
import {
  Modal,
  Input,
  Button,
  List,
  Checkbox,
  Typography,
  message,
  Spin,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { searchWeb } from "../services/searchWebService";

interface SearchResult {
  title: string;
  url: string;
}

interface SearchWebModalProps {
  visible: boolean;
  onClose: () => void;
  onAttachLinks: (links: { type: "link"; url: string; name: string }[]) => void;
}

const MAX_SELECT = 2;
const MAX_RESULTS = 20;

const SearchWebModal: React.FC<SearchWebModalProps> = ({
  visible,
  onClose,
  onAttachLinks,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      message.error("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }
    if (query.length > 40) {
      message.error("Từ khóa tối đa 40 ký tự");
      return;
    }

    setLoading(true);
    setSearched(true);
    setResults([]);
    setSelected([]);

    try {
      console.log("[DEBUG] Gọi API searchWeb với query:", query);
      const data = await searchWeb(query);
      console.log("[DEBUG] Kết quả nhận được:", data);
      if (Array.isArray(data.results)) {
        setResults(data.results.slice(0, MAX_RESULTS));
      } else {
        message.error("Không tìm thấy kết quả phù hợp");
      }
    } catch (err: any) {
      console.error("[DEBUG] Lỗi khi gọi searchWeb:", err);
      message.error("Lỗi khi tìm kiếm web");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (selected.includes(idx)) {
      setSelected(selected.filter((i) => i !== idx));
    } else {
      if (selected.length >= MAX_SELECT) {
        message.warning(`Chỉ được chọn tối đa ${MAX_SELECT} link!`);
        return;
      }
      setSelected([...selected, idx]);
    }
  };

  const handleAttach = () => {
    const links = selected.map((i) => ({
      type: "link" as const,
      url: results[i].url,
      name: results[i].title || results[i].url,
    }));
    onAttachLinks(links);
    setQuery("");
    setResults([]);
    setSelected([]);
    setSearched(false);
    onClose();
  };

  const handleCancel = () => {
    setQuery("");
    setResults([]);
    setSelected([]);
    setSearched(false);
    onClose();
  };

  return (
    <Modal
      open={visible}
      title={
        <span>
          <SearchOutlined /> Tìm kiếm trên web
        </span>
      }
      onCancel={handleCancel}
      onOk={handleAttach}
      okText="Đính kèm"
      okButtonProps={{
        disabled: selected.length === 0 || selected.length > MAX_SELECT,
      }}
      cancelText="Hủy"
      destroyOnHidden
    >
      <Input.Search
        placeholder="Nhập từ khóa tìm kiếm..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        maxLength={40}
        enterButton={<SearchOutlined />}
        allowClear
        style={{ marginBottom: 16 }}
        disabled={loading}
      />
      {loading ? (
        <Spin style={{ width: "100%", display: "block", margin: "24px 0" }} />
      ) : (
        <List
          size="small"
          bordered
          dataSource={results}
          locale={{ emptyText: searched ? "Không có kết quả" : "" }}
          renderItem={(item, idx) => (
            <List.Item
              style={{ display: "flex", alignItems: "center", paddingRight: 8 }}
              actions={[
                <Checkbox
                  checked={selected.includes(idx)}
                  onChange={() => handleSelect(idx)}
                  disabled={
                    !selected.includes(idx) && selected.length >= MAX_SELECT
                  }
                />,
              ]}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong style={{ display: "block" }}>
                  {item.title}
                </Typography.Text>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    maxWidth: 320,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    color: "#1677ff",
                  }}
                  title={item.url}
                >
                  {item.url}
                </a>
              </div>
            </List.Item>
          )}
          style={{ maxHeight: 400, overflowY: "auto" }}
        />
      )}
    </Modal>
  );
};

export default SearchWebModal;
