import React, { useState } from "react";
import {
  Modal,
  Upload,
  Button,
  Input,
  List,
  Typography,
  message,
} from "antd";
import {
  PaperClipOutlined,
  LinkOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

export type AttachmentItem =
  | { type: "file"; file: File; name: string }
  | { type: "link"; url: string; name: string };

interface AttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  onOk: () => void;
  attachments: AttachmentItem[];
  setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>;
  maxFiles?: number;
}

const AttachmentModal: React.FC<AttachmentModalProps> = ({
  visible,
  onClose,
  onOk,
  attachments,
  setAttachments,
  maxFiles = 2,
}) => {
  const [linkInput, setLinkInput] = useState("");
  const [fileError, setFileError] = useState("");

  const handleFileChange = (info: {
    file: UploadFile;
    fileList: UploadFile[];
  }) => {
    setFileError("");

    const files = info.fileList
      .filter((f) => f.originFileObj)
      .map((f) => f.originFileObj as File);

    const totalCount = attachments.length + files.length;
    if (totalCount > maxFiles) {
      setFileError(`Tổng cộng chỉ được chọn tối đa ${maxFiles} file hoặc link!`);
      return;
    }

    for (const file of files) {
      if (file.size > 1024 * 1024) {
        setFileError(`File ${file.name} vượt quá 1MB!`);
        return;
      }

      const isDuplicate =
        attachments.some(
          (a) =>
            a.type === "file" &&
            a.name === file.name &&
            (a as any).file.size === file.size
        ) ||
        files.filter(
          (f) => f.name === file.name && f.size === file.size
        ).length > 1;

      if (isDuplicate) {
        setFileError(`File ${file.name} đã được chọn!`);
        return;
      }
    }

    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({ type: "file" as const, file: f, name: f.name })),
    ]);
  };

  const handleAddLink = () => {
    const url = linkInput.trim();
    if (!url) return;

    if (!/^https?:\/\//.test(url)) {
      message.error("Link phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    if (attachments.length >= maxFiles) {
      message.error(`Tổng cộng chỉ được chọn tối đa ${maxFiles} file hoặc link!`);
      return;
    }

    if (attachments.some((a) => a.type === "link" && a.url === url)) {
      message.error("Link đã được thêm!");
      return;
    }

    setAttachments((prev) => [
      ...prev,
      { type: "link", url, name: url },
    ]);
    setLinkInput("");
  };

  const handleRemove = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      open={visible}
      title="Đính kèm file hoặc link"
      onCancel={onClose}
      onOk={onOk}
      okText="Xong"
      destroyOnClose
    >
      <Typography.Text strong>
        1. Kéo thả file hoặc chọn file (tối đa {maxFiles}, mỗi file ≤ 1MB):
      </Typography.Text>
      <Upload.Dragger
        multiple
        accept=".pdf,.doc,.docx,.txt"
        beforeUpload={() => false}
        showUploadList={false}
        customRequest={() => {}}
        onChange={handleFileChange}
        style={{ margin: "12px 0" }}
        disabled={attachments.length >= maxFiles}
      >
        <p className="ant-upload-drag-icon">
          <PaperClipOutlined style={{ color: "#52c41a" }} />
        </p>
        <p className="ant-upload-text">Kéo thả hoặc bấm để chọn file</p>
        <p className="ant-upload-hint">
          Chỉ hỗ trợ .pdf, .doc, .docx, .txt (≤ 1MB)
        </p>
      </Upload.Dragger>

      {fileError && (
        <div style={{ color: "#ff4d4f", marginBottom: 8 }}>{fileError}</div>
      )}

      <Typography.Text strong>2. Hoặc dán link (URL):</Typography.Text>
      <div style={{ display: "flex", gap: 8, margin: "8px 0 16px" }}>
        <Input
          prefix={<LinkOutlined />}
          placeholder="Dán link vào đây..."
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onPressEnter={handleAddLink}
        />
        <Button type="primary" onClick={handleAddLink}>
          Thêm link
        </Button>
      </div>

      <List
        size="small"
        header={attachments.length > 0 ? "Đã chọn" : undefined}
        dataSource={attachments}
        renderItem={(item, idx) => (
          <List.Item
            actions={[
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={() => handleRemove(idx)}
              />,
            ]}
          >
            {item.type === "file" ? (
              <span>
                <PaperClipOutlined style={{ color: "#52c41a" }} /> {item.name}
              </span>
            ) : (
              <span>
                <LinkOutlined style={{ color: "#1890ff" }} /> {item.name}
              </span>
            )}
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default AttachmentModal;
