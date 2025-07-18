// client/src/pages/UserProfileModal.tsx
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
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<Record<string, string>>({});
  // Thêm state để track thứ tự các field với ID ổn định
  const [fields, setFields] = useState<Array<{id: string, key: string, value: string}>>([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    if (visible) {
      getUserProfile()
        .then((res) => {
          setProfile(res);
          // Chuyển object thành array với ID ổn định
          const fieldsArray = Object.entries(res).map(([key, value], index) => ({
            id: `field_${index}`,
            key,
            value
          }));
          setFields(fieldsArray);
          setNextId(fieldsArray.length);
          setEditing(false);
          setTempProfile({});
        })
        .catch(() => message.error("Không tải được hồ sơ người dùng"));
    }
  }, [visible]);

  const handleEdit = () => {
    // Chuyển profile thành tempProfile format
    const tempData: Record<string, string> = {};
    fields.forEach(field => {
      tempData[field.key] = field.value;
    });
    setTempProfile(tempData);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setTempProfile({});
    // Reset lại fields từ profile gốc
    const fieldsArray = Object.entries(profile).map(([key, value], index) => ({
      id: `field_${index}`,
      key,
      value
    }));
    setFields(fieldsArray);
  };

  const validateAndSave = async () => {
    // Kiểm tra các trường có nội dung
    const nonEmptyFields: Record<string, string> = {};
    
    for (const field of fields) {
      const trimmedKey = field.key.trim();
      const trimmedValue = field.value.trim();
      
      // Bỏ qua nếu cả key và value đều rỗng
      if (!trimmedKey && !trimmedValue) continue;
      
      // Kiểm tra key không được rỗng nếu có value
      if (!trimmedKey && trimmedValue) {
        return message.error("Tên trường không được để trống khi có giá trị");
      }
      
      // Kiểm tra value không được rỗng nếu có key
      if (trimmedKey && !trimmedValue) {
        return message.error(`Giá trị của "${trimmedKey}" không được để trống`);
      }
      
      // Thêm vào danh sách các trường hợp lệ
      if (trimmedKey && trimmedValue) {
        nonEmptyFields[trimmedKey] = trimmedValue;
      }
    }

    Modal.confirm({
      title: "Xác nhận cập nhật hồ sơ?",
      icon: <ExclamationCircleOutlined />,
      okText: "Lưu",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await updateUserProfile(nonEmptyFields);
          setProfile(nonEmptyFields);
          // Cập nhật lại fields sau khi save
          const fieldsArray = Object.entries(nonEmptyFields).map(([key, value], index) => ({
            id: `field_${index}`,
            key,
            value
          }));
          setFields(fieldsArray);
          setNextId(fieldsArray.length);
          message.success("Đã lưu hồ sơ");
          setEditing(false);
        } catch {
          message.error("Không thể lưu hồ sơ");
        }
      },
    });
  };

  const handleFieldChange = (fieldId: string, newKey: string) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, key: newKey } : field
    ));
  };

  const handleValueChange = (fieldId: string, newValue: string) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, value: newValue } : field
    ));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const addField = () => {
    const newField = {
      id: `field_${nextId}`,
      key: "Trường mới",
      value: ""
    };
    setFields([...fields, newField]);
    setNextId(nextId + 1);
  };

  // Render fields theo thứ tự đã lưu
  const renderFields = () => {
    if (!editing) {
      return Object.entries(profile).map(([field, value]) => (
        <div key={field} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text strong style={{ fontSize: "15px" }}>
                {field}:
              </Text>
            </Col>
            <Col span={18}>
              {value?.trim() ? (
                <div
                  style={{
                    background: "#f5f5f5",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: "14px",
                    border: "1px solid #e0e0e0",
                    maxWidth: "100%",
                  }}
                >
                  {value}
                </div>
              ) : (
                <Text type="secondary" italic>
                  (Không có dữ liệu)
                </Text>
              )}
            </Col>
          </Row>
        </div>
      ));
    }

    // Render theo thứ tự đã định với ID ổn định
    return fields.map((field) => (
      <div key={field.id} style={{ marginBottom: 24 }}>
        <Row gutter={16} align="top">
          <Col span={6}>
            <Input
              value={field.key}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              style={{ fontWeight: 600 }}
              placeholder="Tên trường..."
            />
            <Tooltip title="Xóa trường">
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                style={{ marginTop: 8 }}
                onClick={() => removeField(field.id)}
              />
            </Tooltip>
          </Col>
          <Col span={18}>
            <Input.TextArea
              rows={1}
              value={field.value}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              placeholder="Giá trị..."
            />
          </Col>
        </Row>
        <Divider />
      </div>
    ));
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
          {renderFields()}
          <Button icon={<EditOutlined />} onClick={handleEdit} type="primary">
            Chỉnh sửa
          </Button>
        </div>
      ) : (
        <div>
          {renderFields()}
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