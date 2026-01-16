import React, { useState, useEffect } from "react";
import { Layout, Card, Row, Col, Button, Table, Tag, Statistic, Alert, Input, Modal, Form, Select, Spin, Space, Typography, Tooltip, Progress, Avatar, Divider, notification } from "antd";
import { PlayCircleOutlined, StopOutlined, PlusOutlined, DashboardOutlined, SettingOutlined, EyeOutlined, CloudUploadOutlined, LineChartOutlined, LinkOutlined, CopyOutlined, CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, YoutubeOutlined, FacebookOutlined, TwitchOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";
import io from "socket.io-client";
import "./index.css";

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Color scheme from your reference
const colors = {
  primary: "#1890ff",      // Ant Design Blue
  secondary: "#52c41a",    // Green
  danger: "#ff4d4f",       // Red
  warning: "#faad14",      // Yellow/Gold
  dark: "#001529",         // Dark Blue
  light: "#f0f2f5",        // Light Gray
  purple: "#722ed1",       // Purple
  cyan: "#13c2c2",         // Cyan
  magenta: "#eb2f96",      // Magenta
  gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
};

function App() {
  const [streams, setStreams] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [stats, setStats] = useState({});
  const [socket, setSocket] = useState(null);
  const [form] = Form.useForm();
  const [destForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("streams");

  useEffect(() => {
    const newSocket = io("http://localhost:3100");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    newSocket.on("init", (data) => {
      setStreams(data.streams || []);
      setDestinations(data.destinations || []);
      setLoading(false);
    });

    newSocket.on("stream_update", (stream) => {
      setStreams(prev => {
        const index = prev.findIndex(s => s.id === stream.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = stream;
          return updated;
        }
        return [...prev, stream];
      });
      
      notification.success({
        message: "Stream Updated",
        description: `${stream.name} is now ${stream.status}`,
      });
    });

    newSocket.on("destination_update", (dest) => {
      setDestinations(prev => {
        const index = prev.findIndex(d => d.id === dest.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = dest;
          return updated;
        }
        return [...prev, dest];
      });
    });

    newSocket.on("stream_removed", (streamId) => {
      setStreams(prev => prev.filter(s => s.id !== streamId));
    });

    fetchData();

    return () => newSocket.close();
  }, []);

  const fetchData = async () => {
    try {
      const [streamsRes, destsRes, statsRes] = await Promise.all([
        axios.get("http://localhost:3100/api/ingests"),
        axios.get("http://localhost:3100/api/destinations"),
        axios.get("http://localhost:3100/api/stats")
      ]);
      setStreams(streamsRes.data);
      setDestinations(destsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      notification.error({
        message: "Connection Error",
        description: "Cannot connect to server. Make sure backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = async (values) => {
    try {
      await axios.post("http://localhost:3100/api/ingests", {
        name: values.name,
        stream_key: values.stream_key || `stream_${Date.now()}`,
      });
      setModalVisible(false);
      form.resetFields();
      notification.success({
        message: "Stream Created",
        description: "New stream has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating stream:", error);
      notification.error({
        message: "Creation Failed",
        description: "Failed to create stream. Please try again.",
      });
    }
  };

  const handleCreateDestination = async (values) => {
    try {
      await axios.post("http://localhost:3100/api/destinations", values);
      setDestinationModalVisible(false);
      destForm.resetFields();
      notification.success({
        message: "Destination Added",
        description: "New streaming destination has been added.",
      });
    } catch (error) {
      console.error("Error creating destination:", error);
    }
  };

  const handleStartStream = (stream) => {
    Modal.info({
      title: `Start Streaming: ${stream.name}`,
      width: 700,
      icon: <InfoCircleOutlined style={{ color: colors.primary }} />,
      content: (
        <div>
          <Alert
            message="Streaming Instructions"
            description="Use OBS Studio or FFmpeg with the following settings:"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Card title="📹 RTMP Settings" style={{ marginBottom: 16 }}>
            <Form layout="vertical">
              <Form.Item label="Server URL">
                <Input 
                  value="rtmp://localhost:1936/live" 
                  readOnly 
                  addonAfter={
                    <Tooltip title="Copy">
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={() => {
                          navigator.clipboard.writeText("rtmp://localhost:1936/live");
                          notification.success({ message: "Copied to clipboard" });
                        }}
                      />
                    </Tooltip>
                  }
                />
              </Form.Item>
              <Form.Item label="Stream Key">
                <Input 
                  value={stream.stream_key} 
                  readOnly 
                  addonAfter={
                    <Tooltip title="Copy">
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={() => {
                          navigator.clipboard.writeText(stream.stream_key);
                          notification.success({ message: "Copied to clipboard" });
                        }}
                      />
                    </Tooltip>
                  }
                />
              </Form.Item>
              <Form.Item label="Full RTMP URL">
                <Input 
                  value={`rtmp://localhost:1936/live/${stream.stream_key}`}
                  readOnly 
                  addonAfter={
                    <Tooltip title="Copy">
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={() => {
                          navigator.clipboard.writeText(`rtmp://localhost:1936/live/${stream.stream_key}`);
                          notification.success({ message: "Copied to clipboard" });
                        }}
                      />
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="📺 Watch Stream">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>HLS Playback URL:</Text>
              <Input 
                value={`http://localhost:8001/live/${stream.stream_key}/index.m3u8`}
                readOnly 
                addonAfter={
                  <Tooltip title="Copy">
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={() => {
                        navigator.clipboard.writeText(`http://localhost:8001/live/${stream.stream_key}/index.m3u8`);
                        notification.success({ message: "Copied to clipboard" });
                      }}
                    />
                  </Tooltip>
                }
              />
              <Text type="secondary">
                Open this URL in VLC, OBS, or any HLS compatible player
              </Text>
            </Space>
          </Card>
        </div>
      ),
    });
  };

  const handleDeleteStream = async (streamId) => {
    Modal.confirm({
      title: "Delete Stream",
      content: "Are you sure you want to delete this stream?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:3100/api/ingests/${streamId}`);
          notification.success({
            message: "Stream Deleted",
            description: "Stream has been deleted successfully.",
          });
        } catch (error) {
          console.error("Error deleting stream:", error);
        }
      },
    });
  };

  const handleUpdateStatus = async (streamId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "stopped" : "active";
    try {
      await axios.put(`http://localhost:3100/api/ingests/${streamId}`, {
        status: newStatus,
        viewers: newStatus === "active" ? Math.floor(Math.random() * 100) + 1 : 0
      });
    } catch (error) {
      console.error("Error updating stream:", error);
    }
  };

  const getPlatformIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("youtube")) return <YoutubeOutlined style={{ color: "#FF0000" }} />;
    if (lowerName.includes("facebook")) return <FacebookOutlined style={{ color: "#1877F2" }} />;
    if (lowerName.includes("twitch")) return <TwitchOutlined style={{ color: "#9146FF" }} />;
    return <LinkOutlined />;
  };

  const streamColumns = [
    {
      title: "Stream Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: colors.dark }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Key: <Tag color="blue" style={{ fontSize: 11, padding: "0 6px" }}>{record.stream_key}</Tag>
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag 
          color={status === "active" ? "green" : "red"} 
          icon={status === "active" ? <CheckCircleOutlined /> : <StopOutlined />}
          style={{ fontWeight: "bold", padding: "4px 8px" }}
        >
          {status === "active" ? "LIVE" : "STOPPED"}
        </Tag>
      ),
    },
    {
      title: "Viewers",
      dataIndex: "viewers",
      key: "viewers",
      render: (viewers) => (
        <Space>
          <EyeOutlined style={{ color: colors.secondary }} />
          <Text strong>{viewers}</Text>
        </Space>
      ),
    },
    {
      title: "Bitrate",
      dataIndex: "bitrate",
      key: "bitrate",
      render: (bitrate) => (
        <Space>
          <LineChartOutlined style={{ color: colors.cyan }} />
          <Text>{bitrate > 0 ? `${(bitrate / 1000).toFixed(1)} Mbps` : "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Start Streaming">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleStartStream(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === "active" ? "Stop Stream" : "Activate Stream"}>
            <Button 
              type={record.status === "active" ? "default" : "primary"}
              danger={record.status === "active"}
              icon={record.status === "active" ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleUpdateStatus(record.id, record.status)}
            />
          </Tooltip>
          <Tooltip title="Delete Stream">
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteStream(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: colors.gradient 
      }}>
        <Spin size="large" tip="Loading IORELAY888..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: colors.gradient }}>
      <Header style={{ 
        background: "rgba(255, 255, 255, 0.95)", 
        backdropFilter: "blur(10px)",
        padding: "0 24px",
        borderBottom: `1px solid ${colors.light}`
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <CloudUploadOutlined style={{ fontSize: 28, color: colors.primary }} />
              <Space direction="vertical" size={0}>
                <Title level={3} style={{ margin: 0, color: colors.dark }}>IORELAY888</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Professional Streaming Server</Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space size="large">
              <Statistic
                title="Active Streams"
                value={stats.active || 0}
                valueStyle={{ color: colors.primary, fontSize: 24 }}
                prefix={<PlayCircleOutlined />}
              />
              <Statistic
                title="Total Viewers"
                value={stats.total_viewers || 0}
                valueStyle={{ color: colors.secondary, fontSize: 24 }}
                prefix={<EyeOutlined />}
              />
              <Statistic
                title="Total Streams"
                value={stats.total || 0}
                valueStyle={{ color: colors.purple, fontSize: 24 }}
                prefix={<DashboardOutlined />}
              />
            </Space>
          </Col>
        </Row>
      </Header>

      <Layout>
        <Sider width={280} style={{ 
          background: "rgba(255, 255, 255, 0.9)", 
          margin: 16, 
          borderRadius: 12,
          border: `1px solid rgba(0, 0, 0, 0.1)`
        }}>
          <div style={{ padding: 24 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
                style={{ 
                  background: colors.primary,
                  border: "none",
                  height: 48,
                  fontWeight: "bold"
                }}
              >
                New Stream
              </Button>
              <Button
                block
                size="large"
                icon={<LinkOutlined />}
                onClick={() => setDestinationModalVisible(true)}
                style={{ height: 48 }}
              >
                Add Destination
              </Button>
            </Space>
            
            <Divider />
            
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button 
                type={activeTab === "streams" ? "primary" : "text"}
                block 
                icon={<DashboardOutlined />}
                onClick={() => setActiveTab("streams")}
                style={{ textAlign: "left", height: 40 }}
              >
                Stream Management
              </Button>
              <Button 
                type={activeTab === "destinations" ? "primary" : "text"}
                block 
                icon={<SettingOutlined />}
                onClick={() => setActiveTab("destinations")}
                style={{ textAlign: "left", height: 40 }}
              >
                Destinations
              </Button>
              <Button 
                type={activeTab === "stats" ? "primary" : "text"}
                block 
                icon={<LineChartOutlined />}
                onClick={() => setActiveTab("stats")}
                style={{ textAlign: "left", height: 40 }}
              >
                Statistics
              </Button>
            </Space>
            
            <Card 
              title="System Info" 
              size="small" 
              style={{ marginTop: 24, background: "rgba(240, 242, 245, 0.5)" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text type="secondary">RTMP Server</Text>
                <Text copyable strong>rtmp://localhost:1936</Text>
                
                <Text type="secondary" style={{ marginTop: 8 }}>HLS Server</Text>
                <Text copyable strong>http://localhost:8001</Text>
                
                <Text type="secondary" style={{ marginTop: 8 }}>API Server</Text>
                <Text copyable strong>http://localhost:3100</Text>
              </Space>
            </Card>
          </div>
        </Sider>

        <Content style={{ padding: 24 }}>
          {activeTab === "streams" && (
            <Card 
              title={
                <Space>
                  <DashboardOutlined />
                  <span>Stream Management</span>
                  <Tag color="blue">{streams.length} streams</Tag>
                </Space>
              }
              className="glass-card"
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  Add Stream
                </Button>
              }
            >
              <Table
                columns={streamColumns}
                dataSource={streams}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                rowClassName={(record) => record.status === "active" ? "active-row" : ""}
              />
            </Card>
          )}
          
          {activeTab === "destinations" && (
            <Card 
              title={
                <Space>
                  <LinkOutlined />
                  <span>Streaming Destinations</span>
                  <Tag color="green">{destinations.length} platforms</Tag>
                </Space>
              }
              className="glass-card"
            >
              <Row gutter={[16, 16]}>
                {destinations.map(dest => (
                  <Col span={8} key={dest.id}>
                    <Card
                      hoverable
                      style={{ 
                        borderRadius: 12,
                        border: `2px solid ${dest.enabled ? dest.color || colors.primary : "#d9d9d9"}`,
                        opacity: dest.enabled ? 1 : 0.6
                      }}
                    >
                      <Space direction="vertical" align="center" style={{ width: "100%" }}>
                        {getPlatformIcon(dest.name)}
                        <Title level={5} style={{ margin: 0 }}>{dest.name}</Title>
                        <Tag color={dest.enabled ? "success" : "default"}>
                          {dest.enabled ? "ENABLED" : "DISABLED"}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dest.type.toUpperCase()}
                        </Text>
                        <Text code style={{ fontSize: 11 }} ellipsis>
                          {dest.url}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
          
          {activeTab === "stats" && (
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  <span>System Statistics</span>
                </Space>
              }
              className="glass-card"
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Uptime"
                      value={Math.floor(process.uptime() / 60)}
                      suffix="minutes"
                      prefix={<CheckCircleOutlined style={{ color: colors.secondary }} />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Active Connections"
                      value={stats.active || 0}
                      prefix={<PlayCircleOutlined style={{ color: colors.primary }} />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Total Viewers"
                      value={stats.total_viewers || 0}
                      prefix={<EyeOutlined style={{ color: colors.magenta }} />}
                    />
                  </Card>
                </Col>
              </Row>
              
              <Card title="Service Status" style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Alert message="RTMP Server" description="rtmp://localhost:1936" type="success" showIcon />
                  <Alert message="HLS Server" description="http://localhost:8001" type="success" showIcon />
                  <Alert message="API Server" description="http://localhost:3100" type="success" showIcon />
                  <Alert message="WebSocket" description="ws://localhost:3100" type="success" showIcon />
                </Space>
              </Card>
            </Card>
          )}
        </Content>
      </Layout>

      {/* Create Stream Modal */}
      <Modal
        title="Create New Stream"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        okText="Create Stream"
        cancelText="Cancel"
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateStream}>
          <Form.Item
            name="name"
            label="Stream Name"
            rules={[{ required: true, message: "Please enter stream name" }]}
          >
            <Input placeholder="Enter a descriptive name" size="large" />
          </Form.Item>
          <Form.Item
            name="stream_key"
            label="Stream Key"
            extra="Leave empty to auto-generate a unique key"
          >
            <Input placeholder="my_stream_key" size="large" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Destination Modal */}
      <Modal
        title="Add Streaming Destination"
        open={destinationModalVisible}
        onOk={() => destForm.submit()}
        onCancel={() => setDestinationModalVisible(false)}
        okText="Add Destination"
        cancelText="Cancel"
        width={500}
      >
        <Form form={destForm} layout="vertical" onFinish={handleCreateDestination}>
          <Form.Item
            name="name"
            label="Platform Name"
            rules={[{ required: true, message: "Please enter platform name" }]}
          >
            <Input placeholder="YouTube, Twitch, Facebook, etc." size="large" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Stream Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select type" size="large">
              <Option value="rtmp">RTMP</Option>
              <Option value="hls">HLS</Option>
              <Option value="webrtc">WebRTC</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="url"
            label="Server URL"
            rules={[{ required: true, message: "Please enter server URL" }]}
          >
            <Input placeholder="rtmp://server.url/stream" size="large" />
          </Form.Item>
          <Form.Item
            name="stream_key"
            label="Stream Key (Optional)"
          >
            <Input placeholder="Your stream key" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;
