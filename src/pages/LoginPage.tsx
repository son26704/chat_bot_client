import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values);
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center' }}>
          Login
        </Title>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Invalid email!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              Login
            </Button>
          </Form.Item>
          <Button type="link" onClick={() => navigate('/register')} block>
            Don't have an account? Register
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;