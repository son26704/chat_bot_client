// client/src/pages/UserProfileSuggestModal.tsx
import {
  Modal,
  Button,
  Input,
  Typography,
  Divider,
  Tooltip,
  Row,
  Col,
  message,
} from "antd";
import { useState, useEffect } from "react";
import {
  DeleteOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { updateUserProfile } from "../services/authService";

const { Title } = Typography;

const UserProfileSuggestModal = ({
  visible,
  onClose,
  data,
}: {
  visible: boolean;
  onClose: () => void;
  data: Record<string, string> | null;
}) => {
  const [profile, setProfile] = useState<Record<string, string>>({});
  // Thêm state để track thứ tự các field với ID ổn định
  const [fields, setFields] = useState<Array<{id: string, key: string, value: string}>>([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    if (visible && data) {
      setProfile(data);
      // Chuyển object thành array với ID ổn định
      const fieldsArray = Object.entries(data).map(([key, value], index) => ({
        id: `field_${index}`,
        key,
        value
      }));
      setFields(fieldsArray);
      setNextId(fieldsArray.length);
    } else {
      setProfile({});
      setFields([]);
    }
  }, [visible, data]);

  const handleChangeKey = (fieldId: string, newKey: string) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, key: newKey } : field
    ));
  };

  const handleChangeValue = (fieldId: string, newValue: string) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, value: newValue } : field
    ));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const validateAndSubmit = () => {
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
      onOk: async () => {
        try {
          await updateUserProfile(nonEmptyFields);
          message.success("Đã cập nhật hồ sơ");
          onClose();
        } catch {
          message.error("Lỗi khi cập nhật hồ sơ");
        }
      },
    });
  };

  // Render fields theo thứ tự đã lưu
  const renderFields = () => {
    return fields.map((field) => (
      <div key={field.id} style={{ marginBottom: 24 }}>
        <Row gutter={16} align="top">
          <Col span={6}>
            <Input
              value={field.key}
              onChange={(e) => handleChangeKey(field.id, e.target.value)}
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
              onChange={(e) => handleChangeValue(field.id, e.target.value)}
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
      title={<Title level={4}>🧠 Gợi ý cập nhật hồ sơ</Title>}
      width={800}
      maskClosable={false}
      destroyOnHidden={true}
    >
      {renderFields()}
      <div style={{ display: "flex", justifyContent: "end" }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={validateAndSubmit}
        >
          Lưu
        </Button>
      </div>
    </Modal>
  );
};

export default UserProfileSuggestModal;