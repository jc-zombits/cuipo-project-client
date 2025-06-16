'use client';

import { Table, Select, Button, message } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';

// ✅ Componente hijo para CPC
const SelectCPCFiltrado = ({ value, onChange, tieneCPC }) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (tieneCPC) {
        try {
          const res = await axios.get(`http://localhost:5005/api/v1/cuipo/cpc?tiene_cpc=${tieneCPC}`);
          const mapped = res.data.map(c => ({
            label: `${c.codigo} - ${c.clase_o_subclase}`,
            value: `${c.codigo} - ${c.clase_o_subclase}`,
            codigo: c.codigo
          }));
          setOptions(mapped);
        } catch {
          message.error('Error al cargar opciones CPC para una fila');
        }
      }
    };

    fetchData();
  }, [tieneCPC]);

  return (
    <Select
      value={value}
      onChange={onChange}
      style={{ width: '100%' }}
      options={options}
      placeholder="Seleccione un CPC"
    />
  );
};

// ✅ Componente hijo para Producto MGA (corregido)
const SelectProductoFiltrado = ({ value, onChange, proyecto }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proyecto && proyecto.trim() !== '') {
      setLoading(true);
      axios.get(`http://localhost:5005/api/v1/cuipo/productos_por_proyecto/${proyecto.trim()}`)
        .then(res => setOptions(res.data))
        .catch(() => message.error('Error cargando productos del proyecto'))
        .finally(() => setLoading(false));
    } else {
      setOptions([]);
    }
  }, [proyecto]);

  return (
    <Select
      value={value || undefined}
      onChange={onChange}
      options={options}
      loading={loading}
      placeholder="Seleccione producto"
      showSearch
      allowClear
      style={{ width: '100%' }}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      disabled={!proyecto || loading}
      notFoundContent={
        !proyecto
          ? 'Seleccione un proyecto primero'
          : loading
            ? 'Cargando...'
            : 'No hay productos para este proyecto'
      }
    />
  );
};

export default function Ejecucion() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const tableOptions = [
    {
      label: 'cuipo_plantilla_distrito_2025_primer_trimestre_plan_b',
      value: 'cuipo_plantilla_distrito_2025_primer_trimestre_plan_b',
    },
  ];

  const loadTableData = (tableName) => {
    setLoading(true);
    axios.get(`http://localhost:5005/api/v1/cuipo/tables/${tableName}`)
      .then(res => {
        setData(res.data.rows);
        const keys = Object.keys(res.data.rows[0] || {});
        const dynamicColumns = keys.map(key => {
          if (key === 'codigo_y_nombre_del_cpc') {
            return {
              title: 'Código y nombre del CPC',
              dataIndex: key,
              render: (text, record, index) => (
                <SelectCPCFiltrado
                  value={text}
                  onChange={(value) => handleSelectChange(value, index)}
                  tieneCPC={record.tiene_cpc}
                />
              ),
            };
          } else if (key === 'codigo_y_nombre_del_producto_mga') {
            return {
              title: 'Producto MGA',
              dataIndex: key,
              render: (text, record, index) => (
                <SelectProductoFiltrado
                  value={text}
                  onChange={value => handleProductoChange(value, index)} // ✅ usa `index`
                  proyecto={record.proyecto_}
                />
              )
            }
          } else {
            return {
              title: key.replace(/_/g, ' ').toUpperCase(),
              dataIndex: key,
            };
          }
        });

        setColumns(dynamicColumns);
        setSelectedTable(tableName);
        setIsEditing(true);
        setLoading(false);
      })
      .catch(() => {
        message.error('Error al cargar la tabla');
        setLoading(false);
      });
  };

  const handleSelectChange = (value, rowIndex) => {
    setData(prevData => {
      const selectedCodigo = value.split(' - ')[0];
      const updatedRow = {
        ...prevData[rowIndex],
        codigo_y_nombre_del_cpc: value,
        validador_cpc: value ? "CPC OK" : "FAVOR DILIGENCIAR CPC",
        cpc_cuipo: selectedCodigo.substring(0, 7)
      };
      const newData = [...prevData];
      newData[rowIndex] = updatedRow;
      return newData;
    });
  };

  const handleProductoChange = (value, rowIndex) => {
    const codigoNumerico = value?.split('-')[0]?.trim() || '';

    setData(prev => {
      const updatedRow = {
        ...prev[rowIndex],
        codigo_y_nombre_del_producto_mga: value,
        producto_cuipo: codigoNumerico,
        validador_del_producto: value ? "PRODUCTO OK" : "FALTA DILIGENCIAR PRODUCTO"
      };

      const newData = [...prev];
      newData[rowIndex] = updatedRow;
      return newData;
    });
  };

  const saveChanges = () => {
    axios.post('http://localhost:5005/api/v1/cuipo/update', data)
      .then(() => {
        message.success('Cambios guardados');
        setIsEditing(false);
      })
      .catch(() => message.error('Error al guardar cambios'));
  };

  return (
    <div>
      <h2>Editor de Tablas CUIPO</h2>

      {!selectedTable && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setIsEditing(true)}>
            Editar tabla
          </Button>
        </div>
      )}

      {isEditing && !selectedTable && (
        <div style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 400 }}
            placeholder="Seleccione una tabla para editar"
            options={tableOptions}
            onChange={loadTableData}
          />
        </div>
      )}

      {selectedTable && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <Button onClick={() => {
              setIsEditing(false);
              setSelectedTable(null);
              setData([]);
              setColumns([]);
            }}>
              Cancelar edición
            </Button>
            <Button type="primary" onClick={saveChanges}>
              Guardar cambios
            </Button>
          </div>

          <Table
            dataSource={data.map((row, index) => ({ ...row, key: index }))}
            columns={columns}
            loading={loading}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </>
      )}
    </div>
  );
}
