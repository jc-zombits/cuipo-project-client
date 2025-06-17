'use client';

import { Select, Table, message, Card, Typography, Space, Spin } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';

const { Title, Text } = Typography;

// Paleta de colores consistente con el otro componente
const colors = {
  primary: '#1890ff', // Azul
  success: '#52c41a', // Verde
  darkGray: '#2f3542', // Gris oscuro
  lightGray: '#f1f2f6', // Gris claro
  white: '#ffffff',
};

export default function General() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:5005/api/v1/cuipo/tables')
      .then(res => {
        setTables(res.data.tables);
        setLoading(false);
      })
      .catch(() => {
        message.error('Error al cargar las tablas');
        setLoading(false);
      });
  }, []);

  const handleChange = (value) => {
    setSelectedTable(value);
    setTableLoading(true);
    
    axios.get(`http://localhost:5005/api/v1/cuipo/tables/${value}`)
      .then(res => {
        setData(res.data.rows);
        if (res.data.rows.length > 0) {
          const cols = Object.keys(res.data.rows[0]).map((key) => ({
            title: <Text strong style={{ color: colors.darkGray }}>{key}</Text>,
            dataIndex: key,
            key: key,
            ellipsis: true,
            render: (text) => <Text style={{ color: '#555' }}>{text}</Text>,
          }));
          setColumns(cols);
        }
        setTableLoading(false);
      })
      .catch(() => {
        message.error('Error al cargar la tabla seleccionada');
        setTableLoading(false);
      });
  };

  return (
    <div style={{ 
      padding: '40px', 
      minHeight: '100vh',
      background: colors.lightGray,
    }}>
      <Card
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: 'none',
          borderRadius: 8,
        }}
        bodyStyle={{
          padding: '32px',
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Title level={3} style={{ color: colors.darkGray, marginBottom: 0 }}>
            Explorador de Tablas de Base de Datos
          </Title>
          <Text type="secondary" style={{ color: '#7f8c8d' }}>
            Selecciona una tabla para visualizar su contenido
          </Text>

          <div style={{ margin: '24px 0' }}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: colors.darkGray }}>
              Tablas disponibles:
            </Text>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin size="large" />
                <Text style={{ display: 'block', marginTop: 8, color: colors.darkGray }}>
                  Cargando tablas...
                </Text>
              </div>
            ) : (
              <Select
                style={{ width: '100%', maxWidth: 400 }}
                placeholder="Selecciona una tabla"
                onChange={handleChange}
                value={selectedTable || undefined}
                size="large"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {tables.map((table) => (
                  <Select.Option key={table} value={table}>
                    {table}
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>

          {tableLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 8, color: colors.darkGray }}>
                Cargando datos de la tabla...
              </Text>
            </div>
          )}

          {data.length > 0 && !tableLoading && (
            <>
              <div style={{ margin: '16px 0' }}>
                <Text strong style={{ color: colors.darkGray }}>
                  Visualizando tabla: <Text style={{ color: colors.primary }}>{selectedTable}</Text>
                </Text>
                <Text type="secondary" style={{ display: 'block', color: '#7f8c8d' }}>
                  {data.length} registros encontrados
                </Text>
              </div>
              
              <Table 
                dataSource={data} 
                columns={columns} 
                rowKey={(record) => record.id || JSON.stringify(record)}
                size="middle"
                scroll={{ x: 'max-content' }}
                bordered
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} items`,
                  style: { marginRight: 16 },
                }}
              />
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}