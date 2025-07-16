import { Modal, Button, Input, Typography, Divider, Tooltip, Row, Col, message } from "antd";
import { useState, useEffect } from "react";
import {
  DeleteOutlined,
  SaveOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { updateUserProfile } from "../services/authService";

const { Title, Text } = Typography;

const UserProfileSuggestModal = ({
  visible,
  onClose,
  data,
}: {
  visible: boolean;
  onClose: () => void;
  data: Record<string, string[]> | null;
}) => {
  const [profile, setProfile] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (visible && data) {
      setProfile(data);
    }
  }, [visible, data]);

  const handleChangeKey = (oldKey: string, newKey: string) => {
    const updated = { ...profile };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setProfile(updated);
  };

  const handleChangeValue = (key: string, index: number, value: string) => {
    const updated = [...(profile[key] || [])];
    updated[index] = value;
    setProfile({ ...profile, [key]: updated });
  };

  const addValue = (key: string) => {
    if (profile[key].some((v) => !v.trim())) return;
    setProfile({ ...profile, [key]: [...profile[key], ""] });
  };

  const removeValue = (key: string, idx: number) => {
    const values = [...(profile[key] || [])];
    values.splice(idx, 1);
    setProfile({ ...profile, [key]: values });
  };

  const removeField = (key: string) => {
    const updated = { ...profile };
    delete updated[key];
    setProfile(updated);
  };

  const validateAndSubmit = () => {
    for (const [key, values] of Object.entries(profile)) {
      if (!key.trim()) return message.error("Tên trường không được để trống");
      if (!values.length) return message.error(`Trường "${key}" phải có ít nhất 1 giá trị`);
      if (values.some((v) => !v.trim())) return message.error(`Trường "${key}" chứa giá trị rỗng`);
    }

    Modal.confirm({
      title: "Xác nhận cập nhật hồ sơ?",
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          await updateUserProfile(profile);
          message.success("Đã cập nhật hồ sơ");
          onClose();
        } catch {
          message.error("Lỗi khi cập nhật hồ sơ");
        }
      },
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={<Title level={4}>🧠 Gợi ý cập nhật hồ sơ</Title>}
      width={800}
      maskClosable={false}
      destroyOnHidden={true}
    >
      {Object.keys(profile).length === 0 ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Text type="secondary">Không có dữ liệu gợi ý</Text>
        </div>
      ) : (
        Object.entries(profile).map(([key, values], idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            <Row gutter={16} align="top">
              <Col span={6}>
                <Input
                  value={key}
                  onChange={(e) => handleChangeKey(key, e.target.value)}
                  style={{ fontWeight: 600 }}
                />
                <Tooltip title="Xóa trường">
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                    style={{ marginTop: 8 }}
                    onClick={() => removeField(key)}
                  />
                </Tooltip>
              </Col>
              <Col span={18}>
                {values.map((val, valIdx) => (
                  <div key={valIdx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <Input.TextArea
                      rows={1}
                      value={val}
                      onChange={(e) => handleChangeValue(key, valIdx, e.target.value)}
                    />
                    <Tooltip title="Xóa dòng">
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        onClick={() => removeValue(key, valIdx)}
                      />
                    </Tooltip>
                  </div>
                ))}
                <Button
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => addValue(key)}
                  disabled={values.some((v) => !v.trim())}
                >
                  Thêm dòng
                </Button>
              </Col>
            </Row>
            <Divider />
          </div>
        ))
      )}
      <div style={{ display: "flex", justifyContent: "end" }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={validateAndSubmit}>
          Lưu
        </Button>
      </div>
    </Modal>
  );
};

export default UserProfileSuggestModal;
