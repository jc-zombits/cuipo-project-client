'use client';

import { Table, Select, Button, message } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Ejecucion() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [cpcOptions, setCpcOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const tableOptions = [
    {
      label: 'cuipo_plantilla_distrito_2025_vf',
      value: 'cuipo_plantilla_distrito_2025_vf',
    },
  ];

  useEffect(() => {
    axios.get('http://localhost:5005/api/v1/cuipo/cpc')
      .then(res => {
        const options = res.data.map(c => ({
          label: `${c.codigo} - ${c.clase_o_subclase}`,
          value: `${c.codigo} - ${c.clase_o_subclase}`,
          codigo: c.codigo
        }));
        setCpcOptions(options);
      })
      .catch(() => message.error('Error al cargar opciones CPC'));
  }, []);

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
                <Select
                  value={text}
                  onChange={(value) => handleSelectChange(value, index)}
                  style={{ width: '100%' }}
                  options={cpcOptions}
                  placeholder="Seleccione un CPC"
                />
              ),
            };
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
    const selected = cpcOptions.find(opt => opt.value === value);
    setData(prevData => {
      const updatedRow = {
        ...prevData[rowIndex], // 💡 mantener todos los campos originales
        codigo_y_nombre_del_cpc: value,
        validador_cpc: value ? "CPC OK" : "FAVOR DILIGENCIAR CPC",
        cpc_cuipo: selected?.codigo?.substring(0, 7) || ""
      };
      const newData = [...prevData];
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