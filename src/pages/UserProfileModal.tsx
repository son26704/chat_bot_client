import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Input,
  Typography,
  Space,
  Divider,
  Popconfirm,
  message,
  Tooltip,
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

const UserProfileModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
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
    // Validate: không được có trường hoặc giá trị rỗng
    for (const [key, values] of Object.entries(tempProfile)) {
      if (!key.trim()) return message.error("Tên trường không được để trống");
      if (!values.length) return message.error(`Trường "${key}" phải có ít nhất 1 giá trị`);
      if (values.some((v) => !v.trim())) return message.error(`Trường "${key}" chứa giá trị rỗng`);
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
      title={<Title level={4}>🧾 User Profile</Title>}
      width={700}
      maskClosable={false}
    >
      {!editing ? (
        <div>
          {Object.entries(profile).map(([field, values]) => (
            <div key={field} style={{ marginBottom: 20 }}>
              <Text strong>{field}:</Text>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                {values.map((v, idx) => (
                  <li key={idx}>{v || <em>(rỗng)</em>}</li>
                ))}
              </ul>
            </div>
          ))}
          <Button icon={<EditOutlined />} onClick={handleEdit} type="primary">
            Chỉnh sửa
          </Button>
        </div>
      ) : (
        <div>
          {Object.entries(tempProfile).map(([field, values], fieldIdx) => (
            <div key={fieldIdx} style={{ marginBottom: 24 }}>
              <Space align="baseline">
                <Input
                  value={field}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  style={{ fontWeight: 600, width: 200 }}
                />
                <Tooltip title="Xóa trường">
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => removeField(field)}
                  />
                </Tooltip>
              </Space>
              <div style={{ marginTop: 8 }}>
                {values.map((val, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <Input.TextArea
                      rows={1}
                      value={val}
                      onChange={(e) => handleValueChange(field, idx, e.target.value)}
                    />
                    <Tooltip title="Xóa dòng">
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        onClick={() => removeValue(field, idx)}
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
              </div>
              <Divider style={{ margin: "16px 0" }} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button icon={<PlusOutlined />} onClick={addField}>
              Thêm trường
            </Button>
            <div>
              <Button onClick={handleCancelEdit} style={{ marginRight: 8 }}>
                Hủy
              </Button>
              <Button type="primary" onClick={validateAndSave} icon={<SaveOutlined />}>
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
