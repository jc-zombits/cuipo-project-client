'use client'

import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Card, Typography, Space, message, Progress } from 'antd';
import { DownloadOutlined, SyncOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const EjecucionPresupuestal = () => {
  const [tablasDisponibles, setTablasDisponibles] = useState([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState(null);
  const [datosTabla, setDatosTabla] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [cargando, setCargando] = useState(false); // Para carga de datos de tabla
  const [ejecutando, setEjecutando] = useState(false); // Para el proceso de ejecución de partes
  const [copiandoDatos, setCopiandoDatos] = useState(false); // Renombrado para mayor claridad (antes copiando)
  const [progreso, setProgreso] = useState(0);

  // Campos presupuestales para resaltar
  const camposPresupuestales = [
    'ppto_inicial', 'reducciones', 'adiciones',
    'creditos', 'contracreditos', 'total_ppto_actual',
    'disponibilidad', 'compromiso', 'factura',
    'pagos', 'disponible_neto', 'ejecucion', '_ejecucion'
  ];

  // Efecto inicial para obtener tablas disponibles
  useEffect(() => {
    obtenerTablasDisponibles();
  }, []);

  // Función para obtener las tablas disponibles desde el backend
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

  // Función para cargar los datos de una tabla específica en la UI
  const cargarDatosTablaEnUI = async (nombreTabla) => {
    if (!nombreTabla) {
      setDatosTabla([]); // Limpiar la tabla si no hay selección
      setColumnas([]);
      return;
    }

    try {
      setCargando(true);
      console.log(`Cargando datos de la tabla: ${nombreTabla}`);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/ejecucion/obtener-tablas-disponibles?tabla=${nombreTabla}`
      );

      console.log('Respuesta del servidor para cargar datos:', response.data);

      if (response.data.datosTabla && response.data.datosTabla.length > 0) {
        const keys = Object.keys(response.data.datosTabla[0]);
        const columnasGeneradas = keys.map(key => ({
          title: key.toUpperCase().replace(/_/g, ' '),
          dataIndex: key,
          key: key,
          sorter: (a, b) => {
            const valA = a[key];
            const valB = b[key];

            if (typeof valA === 'string' && typeof valB === 'string') {
              return valA.localeCompare(valB);
            }
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return 0;
          },
          className: camposPresupuestales.includes(key) ? 'columna-presupuestal' : ''
        }));

        setColumnas(columnasGeneradas);
        setDatosTabla(response.data.datosTabla);
      } else {
        message.info('La tabla seleccionada no contiene datos');
        setDatosTabla([]);
        setColumnas([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      message.error(`Error al cargar los datos: ${error.response?.data?.error || error.message}`);
      setDatosTabla([]);
      setColumnas([]);
    } finally {
      setCargando(false);
    }
  };

  // Handler para el cambio de selección en el <Select>
  const handleCambioTabla = (value) => {
    setTablaSeleccionada(value);
    cargarDatosTablaEnUI(value); // Carga la tabla en la UI al cambiar la selección
  };

  const limpiarDatos = () => {
    setDatosTabla([]);
    setTablaSeleccionada(null);
    setColumnas([]);
  };

  const ejecutarPresupuesto = async () => {
    if (tablaSeleccionada !== 'cuipo_plantilla_distrito_2025_vf') {
      message.warning('La ejecución de presupuesto solo aplica para la tabla "cuipo_plantilla_distrito_2025_vf". Por favor, selecciona esta tabla antes de ejecutar.');
      return;
    }

    try {
      setEjecutando(true);
      setProgreso(0);

      const partes = [
        { nombre: 'Parte 1 (Fondo)', endpoint: 'ejecucion/procesar/parte1' },
        { nombre: 'Parte 2 (Centro Gestor)', endpoint: 'ejecucion/procesar/parte2' },
        { nombre: 'Parte 3 (POSPRE)', endpoint: 'ejecucion/procesar/parte3' },
        { nombre: 'Parte 4 (Proyecto)', endpoint: 'ejecucion/procesar/parte4' },
        { nombre: 'Parte 5 (Área Funcional)', endpoint: 'ejecucion/procesar/parte5' }
      ];

      for (let i = 0; i < partes.length; i++) {
        const parte = partes[i];
        try {
          await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/${parte.endpoint}`);
          setProgreso(Math.round(((i + 1) / partes.length) * 100));
          message.success(`${parte.nombre} completada`);
        } catch (error) {
          console.error(`Error en ${parte.nombre}:`, error);
          message.error(`Error en ${parte.nombre}: ${error.response?.data?.error || error.message}`);
          throw error;
        }
      }

      // Después de la ejecución, recargar la tabla de plantilla para ver los cambios
      await cargarDatosTablaEnUI('cuipo_plantilla_distrito_2025_vf');
      message.success('Todas las partes de la ejecución presupuestal han sido procesadas exitosamente.');

    } catch (error) {
      console.error('Error general en ejecutarPresupuesto:', error);
      message.error('La ejecución de presupuesto se detuvo debido a un error.');
    } finally {
      setEjecutando(false);
      setProgreso(0);
    }
  };

  // --- El handler para el botón "Traer datos" (ahora encargado de la copia) ---
  const handleTraerDatosYCopiar = async () => {
    // Asegurarse de que la tabla de origen exista y sea la esperada
    const tablaOrigen = 'base_de_ejecucion_presupuestal_31032025';
    const tablaDestino = 'cuipo_plantilla_distrito_2025_vf';

    if (!tablasDisponibles.includes(tablaOrigen) || !tablasDisponibles.includes(tablaDestino)) {
        message.error(`Asegúrate de que "${tablaOrigen}" y "${tablaDestino}" existan en la base de datos.`);
        return;
    }

    try {
      setCopiandoDatos(true);
      message.info(`Iniciando copia de datos de "${tablaOrigen}" a "${tablaDestino}"...`);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ejecucion/copiar-datos-presupuestales`);

      if (response.data.success) {
        message.success(response.data.message);
        // Después de la copia exitosa, cargar la tabla de destino para mostrar los datos copiados
        await cargarDatosTablaEnUI(tablaDestino);
        setTablaSeleccionada(tablaDestino); // Asegurar que la tabla destino esté seleccionada en el select
      } else {
        message.error(response.data.error || 'Error desconocido al copiar los datos.');
      }
    } catch (error) {
      console.error('Error al copiar datos:', error);
      message.error(`Error al copiar los datos: ${error.response?.data?.error || error.message}`);
    } finally {
      setCopiandoDatos(false);
    }
  };
  // --- Fin del handler de copia ---

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
        <Space size="large" align="center" wrap>
          <Select
            suppressHydrationWarning
            showSearch
            style={{ width: 350 }}
            placeholder="Seleccione una tabla"
            optionFilterProp="children"
            onChange={handleCambioTabla} // Al cambiar el select, se carga la tabla en la UI
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

          {/* El botón "Traer datos" ahora llama a la función de copia */}
          <Button
            type="primary"
            icon={<CopyOutlined />} // Cambiado a CopyOutlined para reflejar la acción de copia
            loading={copiandoDatos} // Usa el estado de carga para la copia
            onClick={handleTraerDatosYCopiar} // Este botón activa la copia
            // Deshabilita si ya se está cargando/ejecutando/copiando
            disabled={cargando || ejecutando || copiandoDatos}
          >
            Traer datos (Copiar Base a Plantilla)
          </Button>

          {/* El botón "Copiar Datos Presupuestales" ya no es necesario con esta lógica */}
          {/* Se elimina el botón redundante si "Traer datos" ahora hace la copia */}
          {/* <Button
            type="default"
            icon={<CopyOutlined />}
            loading={copiando}
            onClick={copiarDatosBaseAPlantilla}
            disabled={cargando || ejecutando || copiando}
          >
            Copiar Datos Presupuestales (Eliminado)
          </Button> */}

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={ejecutando}
            onClick={ejecutarPresupuesto}
            // Habilitar solo si la tabla seleccionada es la de plantilla y no se está ejecutando o copiando
            disabled={tablaSeleccionada !== 'cuipo_plantilla_distrito_2025_vf' || ejecutando || copiandoDatos}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Ejecutar Presupuesto
          </Button>

          <Button
            type="default"
            icon={<DownloadOutlined />}
            disabled={datosTabla.length === 0 || ejecutando || copiandoDatos}
          >
            Exportar a Excel
          </Button>

          <Button
            danger
            icon={<ClearOutlined />}
            onClick={limpiarDatos}
            disabled={!tablaSeleccionada || ejecutando || copiandoDatos}
          >
            Limpiar
          </Button>
        </Space>

        {(ejecutando || copiandoDatos) && (
          <Progress
            percent={copiandoDatos ? undefined : progreso}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            format={copiandoDatos ? () => 'Copiando datos base a plantilla...' : (percent) => `${percent}%`}
          />
        )}

        <Table
          columns={columnas}
          dataSource={datosTabla}
          loading={cargando || ejecutando || copiandoDatos} // Añadir copiandoDatos a loading
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