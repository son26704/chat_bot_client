import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Input,
  Typography,
  Divider,
  message,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { getUserProfile, updateUserProfile } from "../services/authService";

const { Title, Text } = Typography;

const UserProfileModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [profile, setProfile] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (visible) {
      getUserProfile()
        .then(setProfile)
        .catch(() => message.error("Không tải được hồ sơ người dùng"));
    }
  }, [visible]);

  const handleEdit = () => {
    setTempProfile(JSON.parse(JSON.stringify(profile)));
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setTempProfile({});
  };

  const validateAndSave = async () => {
    for (const [key, values] of Object.entries(tempProfile)) {
      if (!key.trim()) return message.error("Tên trường không được để trống");
      if (!values.length)
        return message.error(`Trường "${key}" phải có ít nhất 1 giá trị`);
      if (values.some((v) => !v.trim()))
        return message.error(`Trường "${key}" chứa giá trị rỗng`);
    }

    Modal.confirm({
      title: "Xác nhận cập nhật hồ sơ?",
      icon: <ExclamationCircleOutlined />,
      okText: "Lưu",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await updateUserProfile(tempProfile);
          setProfile(tempProfile);
          message.success("Đã lưu hồ sơ");
          setEditing(false);
        } catch {
          message.error("Không thể lưu hồ sơ");
        }
      },
    });
  };

  const handleFieldChange = (oldKey: string, newKey: string) => {
    if (!newKey.trim()) return;
    const updated = { ...tempProfile };
    const value = updated[oldKey];
    delete updated[oldKey];
    updated[newKey] = value;
    setTempProfile(updated);
  };

  const handleValueChange = (field: string, index: number, value: string) => {
    const updated = [...(tempProfile[field] || [])];
    updated[index] = value;
    setTempProfile({ ...tempProfile, [field]: updated });
  };

  const addValue = (field: string) => {
    const existing = tempProfile[field] || [];
    if (existing.some((v) => !v.trim())) return;
    setTempProfile({ ...tempProfile, [field]: [...existing, ""] });
  };

  const removeValue = (field: string, index: number) => {
    const updated = [...(tempProfile[field] || [])];
    updated.splice(index, 1);
    setTempProfile({ ...tempProfile, [field]: updated });
  };

  const removeField = (field: string) => {
    const updated = { ...tempProfile };
    delete updated[field];
    setTempProfile(updated);
  };

  const addField = () => {
    const defaultName = "Trường mới";
    let newKey = defaultName;
    let count = 1;
    while (tempProfile[newKey]) {
      newKey = `${defaultName} ${count++}`;
    }
    setTempProfile({ ...tempProfile, [newKey]: [""] });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={<Title level={4}>🧾 Hồ sơ người dùng</Title>}
      width={800}
      maskClosable={false}
    >
      {!editing ? (
        <div>
          {Object.entries(profile).map(([field, values]) => (
            <div key={field} style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong style={{ fontSize: "15px" }}>
                    {field}:
                  </Text>
                </Col>
                <Col span={18}>
                  {values.length === 0 ? (
                    <Text type="secondary" italic>
                      (Không có dữ liệu)
                    </Text>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {values.map((v, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#f5f5f5",
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: "14px",
                            border: "1px solid #e0e0e0",
                            maxWidth: "100%",
                          }}
                        >
                          {v || <em>(rỗng)</em>}
                        </div>
                      ))}
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          ))}

          <Button icon={<EditOutlined />} onClick={handleEdit} type="primary">
            Chỉnh sửa
          </Button>
        </div>
      ) : (
        <div>
          {Object.entries(tempProfile).map(([field, values], idx) => (
            <div key={idx} style={{ marginBottom: 24 }}>
              <Row gutter={16} align="top">
                <Col span={6}>
                  <Input
                    value={field}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    style={{ fontWeight: 600 }}
                  />
                  <Tooltip title="Xóa trường">
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      size="small"
                      style={{ marginTop: 8 }}
                      onClick={() => removeField(field)}
                    />
                  </Tooltip>
                </Col>
                <Col span={18}>
                  {values.map((val, valIdx) => (
                    <div
                      key={valIdx}
                      style={{ display: "flex", gap: 8, marginBottom: 6 }}
                    >
                      <Input.TextArea
                        rows={1}
                        value={val}
                        onChange={(e) =>
                          handleValueChange(field, valIdx, e.target.value)
                        }
                      />
                      <Tooltip title="Xóa dòng">
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          size="small"
                          onClick={() => removeValue(field, valIdx)}
                        />
                      </Tooltip>
                    </div>
                  ))}
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => addValue(field)}
                    disabled={values.some((v) => !v.trim())}
                  >
                    Thêm dòng
                  </Button>
                </Col>
              </Row>
              <Divider />
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button icon={<PlusOutlined />} onClick={addField}>
              Thêm trường
            </Button>
            <div>
              <Button onClick={handleCancelEdit} style={{ marginRight: 8 }}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={validateAndSave}
                icon={<SaveOutlined />}
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
