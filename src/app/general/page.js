// src/app/general/page.js
'use client';

import { Select, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function General() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5005/api/v1/cuipo/tables')
      .then(res => setTables(res.data.tables))
      .catch(() => message.error('Error al cargar las tablas'));
  }, []);

  const handleChange = (value) => {
    setSelectedTable(value);
    axios.get(`http://localhost:5005/api/v1/cuipo/tables/${value}`)
      .then(res => {
        setData(res.data.rows);
        if (res.data.rows.length > 0) {
          const cols = Object.keys(res.data.rows[0]).map((key) => ({
            title: key,
            dataIndex: key,
            key: key,
          }));
          setColumns(cols);
        }
      })
      .catch(() => message.error('Error al cargar la tabla seleccionada'));
  };

  return (
    <div>
      <h2>Tablas disponibles</h2>
      <Select
        style={{ width: 300 }}
        placeholder="Selecciona una tabla"
        onChange={handleChange}
      >
        {tables.map((table) => (
          <Select.Option key={table} value={table}>
            {table}
          </Select.Option>
        ))}
      </Select>
      <br /><br />
      {data.length > 0 && (
        <Table dataSource={data} columns={columns} rowKey="id" size='small' scroll={{ x: 'max-content' }} />
      )}
    </div>
  );
}