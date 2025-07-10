import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const RegisterPage = () => {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isAuthenticated) navigate('/chat');
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: { email: string; password: string; name: string }) => {
    try {
      await register(values);
    } catch (error) {
      message.error('Registration failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center' }}>
          Register
        </Title>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input />
          </Form.Item>
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
              Register
            </Button>
          </Form.Item>
          <Button type="link" onClick={() => navigate('/login')} block>
            Already have an account? Login
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;