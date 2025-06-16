import { Button, Card, Typography } from 'antd';
import { useAuth } from '../hooks/useAuth';

const { Title } = Typography;

const ChatPage = () => {
  const { user, logout } = useAuth();

  return (
    <Card style={{ margin: '20px' }}>
      <Title level={2}>Chat Page</Title>
      <p>Welcome, {user?.name}!</p>
      <Button type="primary" onClick={logout}>
        Logout
      </Button>
    </Card>
  );
};

export default ChatPage;