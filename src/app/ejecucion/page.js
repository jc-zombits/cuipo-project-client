'use client'

import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Card, Typography, Space, message } from 'antd';
import { DownloadOutlined, SyncOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const EjecucionPresupuestal = () => {
  const [tablasDisponibles, setTablasDisponibles] = useState([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState(null);
  const [datosTabla, setDatosTabla] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // Obtener listado de tablas disponibles al cargar el componente
  useEffect(() => {
    obtenerTablasDisponibles();
  }, []);

  const obtenerTablasDisponibles = async () => {
    try {
      setCargando(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/obtener-tablas-disponibles`);
      setTablasDisponibles(response.data.tablasDisponibles);
    } catch (error) {
      message.error('Error al obtener tablas disponibles');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosTabla = async (nombreTabla) => {
    if (!nombreTabla) return;
    
    try {
      setCargando(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/obtener-tablas-disponibles?tabla=${nombreTabla}`);
      
      if (response.data.datosTabla && response.data.datosTabla.length > 0) {
        // Generar columnas dinámicamente a partir de las keys del primer objeto
        const keys = Object.keys(response.data.datosTabla[0]);
        const columnasGeneradas = keys.map(key => ({
          title: key.toUpperCase().replace(/_/g, ' '),
          dataIndex: key,
          key: key,
          sorter: (a, b) => {
            if (typeof a[key] === 'string' && typeof b[key] === 'string') {
              return a[key].localeCompare(b[key]);
            }
            return a[key] - b[key];
          },
        }));
        
        setColumnas(columnasGeneradas);
        setDatosTabla(response.data.datosTabla);
        setTablaSeleccionada(nombreTabla);
      } else {
        message.info('La tabla seleccionada no contiene datos');
        setDatosTabla([]);
      }
    } catch (error) {
      message.error('Error al cargar los datos de la tabla');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const handleCambioTabla = (value) => {
    cargarDatosTabla(value);
  };

  const limpiarDatos = () => {
    setDatosTabla([]);
    setTablaSeleccionada(null);
  };

  const ejecutarPresupuesto = async () => {
    if (!tablaSeleccionada) {
      message.warning('Por favor seleccione una tabla primero');
      return;
    }

    try {
      setEjecutando(true);
      setProgreso(0);
      
      // Parte 1
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/procesar/parte1`);
      setProgreso(20);
      message.success('Parte 1 completada');
      
      // Parte 2
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/procesar/parte2`);
      setProgreso(40);
      message.success('Parte 2 completada');
      
      // Parte 3
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/procesar/parte3`);
      setProgreso(60);
      message.success('Parte 3 completada');
      
      // Parte 4
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/procesar/parte4`);
      setProgreso(80);
      message.success('Parte 4 completada');
      
      // Parte 5
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/procesar/parte5`);
      setProgreso(100);
      message.success('Proceso completado exitosamente');
      
      // Refrescar los datos
      await cargarDatosTabla(tablaSeleccionada);
      
    } catch (error) {
      console.error('Error en ejecutarPresupuesto:', error);
      message.error(`Error en el proceso: ${error.response?.data?.error || error.message}`);
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <Card
      title={<Title level={3} style={{ margin: 0 }}>EJECUCIÓN PRESUPUESTAL</Title>}
      style={{ 
        margin: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      bordered={false}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space size="large" align="center">
          <Select
            showSearch
            style={{ width: 350 }}
            placeholder="Seleccione una tabla"
            optionFilterProp="children"
            onChange={handleCambioTabla}
            value={tablaSeleccionada}
            loading={cargando}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {tablasDisponibles.map(tabla => (
              <Option key={tabla} value={tabla}>
                {tabla}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={cargando}
            onClick={() => cargarDatosTabla(tablaSeleccionada)}
          >
            Traer datos
          </Button>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={ejecutando}
            onClick={ejecutarPresupuesto}
            disabled={!tablaSeleccionada}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Ejecutar Presupuesto
          </Button>

          <Button
            type="default"
            icon={<DownloadOutlined />}
            disabled={datosTabla.length === 0}
          >
            Exportar a Excel
          </Button>

          <Button
            danger
            icon={<ClearOutlined />}
            onClick={limpiarDatos}
            disabled={!tablaSeleccionada || ejecutando}
          >
            Limpiar
          </Button>
        </Space>

        {ejecutando && (
          <Progress 
            percent={progreso}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        )}

        <Table
          columns={columnas}
          dataSource={datosTabla}
          loading={cargando || ejecutando}
          bordered
          size="middle"
          scroll={{ x: 'max-content' }}
          rowKey={(record) => record.id || JSON.stringify(record)}
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} registros`,
          }}
        />
      </Space>
    </Card>
  );
};

export default EjecucionPresupuestal;