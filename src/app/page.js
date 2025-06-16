'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Modal, Typography, Spin, message, Button } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

export default function Home() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTableData, setSelectedTableData] = useState(null);
  const [fetchingTableData, setFetchingTableData] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const colors = {
    card: '#ecfae5',
    title: '#211c84',
    border: '#e0e0e0',
    accent: '#211c84',
    error: '#ff4d4f',
  };

  const styles = {
    buttonPrimary: {
      backgroundColor: colors.accent,
      color: 'white',
      border: 'none',
    },
    cardTitle: {
      color: colors.accent,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    animatedSection: {
      maxHeight: showDetail ? '1000px' : '0px',
      overflow: 'hidden',
      transition: 'max-height 0.5s ease',
    },
  };

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get('http://localhost:5005/api/v1/cuipo/tables');
        setTables(response.data.tables || []);
      } catch (error) {
        message.error('Error al obtener tablas');
        console.error('Error fetching tables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const handleCardClick = async (tableName) => {
    setSelectedTable(tableName);
    setFetchingTableData(true);
    setShowDetail(false);

    try {
      const response = await axios.get(`http://localhost:5005/api/v1/cuipo/tables/${tableName}`);
      
      if (!response.data.rows || response.data.rows.length === 0) {
        throw new Error('La tabla no contiene datos');
      }

      setSelectedTableData({
        name: tableName,
        fields: Object.keys(response.data.rows[0]),
        count: response.data.rows.length,
        sampleData: response.data.rows,
      });

      setModalOpen(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al cargar detalles de la tabla');
      console.error('Error loading table details:', error);
    } finally {
      setFetchingTableData(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setShowDetail(false);
    setTimeout(() => {
      setSelectedTable(null);
      setSelectedTableData(null);
    }, 300);
  };

  const handleViewDetails = () => {
    setShowDetail(true);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: colors.background, 
      minHeight: '100vh',
      borderRadius: '10px',
    }}>
      <Title 
        level={2} 
        style={{ 
          color: colors.title, 
          textAlign: 'center', 
          marginBottom: '2rem',
        }}
      >
        Proyecto CUIPO - Ejecución presupuestal
      </Title>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: '1rem' }}>Cargando tablas...</Text>
        </div>
      ) : tables.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Text>No se encontraron tablas disponibles</Text>
        </div>
      ) : (
        <Row gutter={[16, 16]} justify="center">
          {tables.map((table) => (
            <Col 
              xs={24} 
              sm={12} 
              md={8} 
              lg={6} 
              key={table}
              style={{ display: 'flex' }}
            >
              <Card
                hoverable
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  width: '100%',
                  cursor: fetchingTableData ? 'wait' : 'pointer',
                }}
                onClick={() => !fetchingTableData && handleCardClick(table)}
                loading={fetchingTableData && selectedTable === table}
              >
                <Title 
                  level={5} 
                  style={styles.cardTitle}
                  title={table}
                >
                  {table}
                </Title>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={`Resumen de tabla: ${selectedTable || ''}`}
        open={modalOpen}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>Cerrar</Button>,
          <Button
            key="details"
            type="primary"
            style={styles.buttonPrimary}
            onClick={handleViewDetails}
            loading={fetchingTableData}
            disabled={showDetail}
          >
            Ver detalle
          </Button>,
        ]}
        width={800}
        centered
        destroyOnHidden
      >
        {selectedTableData ? (
          <div>
            <Text strong>Nombre:</Text> {selectedTableData.name}<br /><br />
            
            <Text strong>Campos ({selectedTableData.fields.length}):</Text>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '8px',
              margin: '12px 0'
            }}>
              {selectedTableData.fields.map((field, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '4px 8px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                  }}
                >
                  {field}
                </div>
              ))}
            </div>
            
            <Text strong>Cantidad de registros:</Text> {selectedTableData.count}<br /><br />

            {/* Detalle expandible */}
            <div style={styles.animatedSection}>
              <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {selectedTableData.fields.map((field, idx) => (
                        <th 
                          key={idx}
                          style={{
                            border: '1px solid #ccc',
                            padding: '6px',
                            background: '#fafafa',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                          }}
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTableData.sampleData.slice(0, 15).map((row, idx) => (
                      <tr key={idx}>
                        {selectedTableData.fields.map((field, fidx) => (
                          <td
                            key={fidx}
                            style={{
                              border: '1px solid #eee',
                              padding: '6px',
                              fontSize: '0.85rem',
                            }}
                          >
                            {row[field] !== null ? String(row[field]) : <i style={{ color: '#999' }}>null</i>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spin size="large" />
          </div>
        )}
      </Modal>
    </div>
  );
}