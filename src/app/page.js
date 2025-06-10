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

  // Paleta de colores
  const colors = {
    //background: '#3674b5',
    card: '#ffffff',
    title: '#ffffdd',
    border: '#e0e0e0',
    accent: '#211c84',
    error: '#ff4d4f',
  };

  // Estilos reutilizables
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
    
    try {
      const response = await axios.get(`http://localhost:5005/api/v1/cuipo/tables/${tableName}`);
      
      if (!response.data.rows || response.data.rows.length === 0) {
        throw new Error('La tabla no contiene datos');
      }

      setSelectedTableData({
        name: tableName,
        fields: Object.keys(response.data.rows[0]),
        count: response.data.rows.length,
        sampleData: response.data.rows.slice(0, 3), // Muestra 3 registros de ejemplo
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
    // Limpiar después de un pequeño delay para mejor animación
    setTimeout(() => {
      setSelectedTable(null);
      setSelectedTableData(null);
    }, 300);
  };

  const handleViewDetails = () => {
    handleModalClose();
    // Usar router.push si estás usando Next.js router
    setTimeout(() => {
      window.location.href = `/detalle/${selectedTable}`;
    }, 200);
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
                  title={table} // Tooltip para nombres largos
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
          <Button
            key="close"
            onClick={handleModalClose}
          >
            Cerrar
          </Button>,
          <Button
            key="details"
            type="primary"
            style={styles.buttonPrimary}
            onClick={handleViewDetails}
            loading={fetchingTableData}
          >
            Ver detalle
          </Button>,
        ]}
        width={800}
        centered
        destroyOnHidden
      >
        {selectedTableData ? (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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